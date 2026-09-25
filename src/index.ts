import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { PrismaClient } from '@prisma/client'

// ---------- 1) Type & database ----------
type Gender = 'male' | 'female' | 'other'

interface Student {
  studentId: string
  firstName: string
  lastName: string
  birthDate: string
  gender: Gender
}

const prisma = new PrismaClient()
const basicAuthUsername = Bun.env.BASIC_AUTH_USERNAME
const basicAuthPassword = Bun.env.BASIC_AUTH_PASSWORD

if (!basicAuthUsername || !basicAuthPassword) {
  throw new Error('BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set')
}

function requireBasicAuth({ request }: { request: Request }) {
  const authorization = request.headers.get('authorization')

  if (!authorization?.startsWith('Basic ')) {
    return new Response(JSON.stringify({ message: 'Authentication required' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="student-api"'
      }
    })
  }

  try {
    const decodedCredentials = atob(authorization.slice(6))
    const separatorIndex = decodedCredentials.indexOf(':')
    const username = decodedCredentials.slice(0, separatorIndex)
    const password = decodedCredentials.slice(separatorIndex + 1)

    if (username !== basicAuthUsername || password !== basicAuthPassword) {
      throw new Error('Invalid credentials')
    }
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="student-api"'
      }
    })
  }
}

function toStudent(student: {
  studentId: string
  firstName: string
  lastName: string
  birthDate: Date
  gender: string
}): Student {
  return {
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
    birthDate: student.birthDate.toISOString().slice(0, 10),
    gender: student.gender as Gender
  }
}

async function getStudents(): Promise<Student[]> {
  const students = await prisma.student.findMany({
    orderBy: { studentId: 'asc' }
  })

  return students.map(toStudent)
}

// ---------- 2) Validation schema ----------
const studentBody = t.Object({
  studentId: t.String({ minLength: 1, maxLength: 20 }),
  firstName: t.String({ minLength: 1, maxLength: 100 }),
  lastName: t.String({ minLength: 1, maxLength: 100 }),
  birthDate: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
  gender: t.Union([
    t.Literal('male'),
    t.Literal('female'),
    t.Literal('other')
  ])
})

const studentUpdateBody = t.Object({
  firstName: t.String({ minLength: 1, maxLength: 100 }),
  lastName: t.String({ minLength: 1, maxLength: 100 }),
  birthDate: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
  gender: t.Union([
    t.Literal('male'),
    t.Literal('female'),
    t.Literal('other')
  ])
})

// ---------- 3) App Routes ----------
const app = new Elysia()
  .use(swagger())
  .group('/api/v1', (api) => api
    .get('/students', () => getStudents())
    .get('/students/:studentId', async ({ params: { studentId }, error }) => {
      const student = await prisma.student.findUnique({
        where: { studentId }
      })

      if (!student) return error(404, { message: 'Student not found' })
      return toStudent(student)
    })
    .post('/students', async ({ body }) => {
      const student = await prisma.student.upsert({
        where: { studentId: body.studentId },
        update: {
          firstName: body.firstName,
          lastName: body.lastName,
          birthDate: new Date(body.birthDate),
          gender: body.gender
        },
        create: {
          studentId: body.studentId,
          firstName: body.firstName,
          lastName: body.lastName,
          birthDate: new Date(body.birthDate),
          gender: body.gender
        }
      })

      return toStudent(student)
    }, { body: studentBody, beforeHandle: requireBasicAuth })
    .put('/students/:studentId', async ({ params: { studentId }, body, error }) => {
      const existingStudent = await prisma.student.findUnique({
        where: { studentId }
      })

      if (!existingStudent) return error(404, { message: 'Student not found' })

      const student = await prisma.student.update({
        where: { studentId },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          birthDate: new Date(body.birthDate),
          gender: body.gender
        }
      })

      return toStudent(student)
    }, { body: studentUpdateBody, beforeHandle: requireBasicAuth })
    .delete('/students/:studentId', async ({ params: { studentId }, error }) => {
      const existingStudent = await prisma.student.findUnique({
        where: { studentId }
      })

      if (!existingStudent) return error(404, { message: 'Student not found' })

      await prisma.student.delete({
        where: { studentId }
      })

      return { message: 'Student deleted successfully' }
    }, { beforeHandle: requireBasicAuth })
  
  )

async function start() {
  await prisma.$connect()
  app.listen(3000)
  console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
}

start().catch((error) => {
  console.error('Failed to start the API:', error)
  process.exit(1)
})