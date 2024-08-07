import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode,sign,verify } from 'hono/jwt'
import { signUpInput ,signInInput} from '@045ayush/medium-common'

export const userRouter = new Hono<{
    Bindings:{
      DATABASE_URL:string
      JWT_SECRET:string
    }
  }>()

userRouter.post('/signup', async(c) => {
  const body=await c.req.json()
  const { success }= signUpInput.safeParse(body)
  if(!success){
    c.status(411)
    return c.text("wrong inputs")
  }
  const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL
  }).$extends(withAccelerate())

  try{
    const user=await prisma.user.create({
      data:{
        username: body.username,
        name: body.name,
        password: body.password
      }
    })

    const jwt=await sign({
      id:user.id
    },c.env.JWT_SECRET)

    c.status(200)

    return c.text(`${jwt}`)
  }
  catch(e){
    c.status(411)
    return c.text("invalid")
  }



  return c.text('Hello Hono!')
})

userRouter.post('/signin', async(c) => {
    const body=await c.req.json()
    const { success }= signInInput.safeParse(body)
  if(!success){
    c.status(411)
    return c.text("wrong inputs")
  }
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())
  
    try{
      const user=await prisma.user.findFirst({
        where:{
          username: body.username,
          password: body.password
        }
      })
      if(!user){
        c.status(403)
        return c.json({
          msg:"invalid credentials"
        })
      }else{
        const jwt=await sign({
        id:user.id
      },c.env.JWT_SECRET)
  
      c.status(200)
  
      return c.text(`${jwt}`)
    }
    }
    catch(e){
      c.status(411)
      return c.text("invalid")
    }
  })