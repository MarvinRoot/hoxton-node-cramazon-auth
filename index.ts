import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()

function createToken(id: number) {
    // @ts-ignore
    return jwt.sign({ id: id }, process.env.MY_SECRET, { expiresIn: '3days' })
}

async function getUserFromToken(token: string) {
    // @ts-ignore
    const decodedData = jwt.verify(token, process.env.MY_SECRET)
    const user = await prisma.user.findUnique({
        // @ts-ignore
        where: { id: decodedData.id },
        include: { orders: true }
    })
    return user
}

app.post('/sign-up', async (req,res) => {
    const {name, email, password} = req.body

    try{
        const hash = bcrypt.hashSync(password, 10)
        const newUser = await prisma.user.create({
            data: {
                name, email, password: hash},
                include: { orders: {include: {item: true} } }
        })
        res.send({newUser, token: createToken(newUser.id)})
    }catch(err){
        //@ts-ignore
        res.status(400).send({error: err.message})
    }
})

app.post('/sign-in', async (req,res)=> {
    const {email, password} = req.body

    try{
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: { orders: { select: { itemId: true, quantity: true } } }
        })
        //@ts-ignore
        const passwordMatch = bcrypt.compareSync(password, user.password)

        if(user && passwordMatch){
            res.send({ user, token: createToken(user.id) })
        }else{
            throw Error('Invalid credentials')
        }
    }catch(err){
        res.status(400).send('Password or Email is invalid')
    }
})

app.get('/validate', async (req,res) => {
    const token = req.headers.authorization

    try{
        // @ts-ignore
        const user = await getUserFromToken(token)
        res.send(user)
    }catch(err){
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany({ include: { orders: {include: {item: true}} } })
    res.send(users)
})

app.get('/users/:id', async (req, res) => {
    const id = Number(req.params.id)
    const user = await prisma.user.findUnique({ where: { id: id } })
    res.send(user)
})

app.delete('/users/:id', async (req, res) => {
    const id = Number(req.params.id)
    try {
        const user = await prisma.user.findUnique({ where: { id } })
        if (user) {
            await prisma.user.delete({ where: { id: id } })
            res.send(user)
        } else {
            res.status(400).send({ error: 'User not found' })
        }
    } catch (error) {
        // @ts-ignore
        res.status(400).send(`<pre>${error.message}</pre>`)
    }
})

app.post('/users', async (req, res) => {
    const { name, email, password } = req.body

    try {
        const newUser = await prisma.user.create(
            {
                data: {
                    name, email, password
                }
            })
        res.send(newUser)
    } catch (error) {
        // @ts-ignore
        res.status(400).send(`<pre>${error.message}</pre>`)
    }
})

app.get('/orders', async (req, res) => {
    const orders = await prisma.order.findMany()
    res.send(orders)
})

app.get('/orders/:id', async (req, res) => {
    const id = Number(req.params.id)
    try {
        const order = await prisma.order.findUnique({ where: { id } })
        res.send(order)
    } catch (error) {
        // @ts-ignore
        res.status(400).send(`<pre>${error.message}</pre>`)
    }
})

app.delete('/orders/:id', async (req, res) => {
    const id = Number(req.params.id)
    try {
        const order = await prisma.order.findUnique({ where: { id } })

        if (order) {
            await prisma.order.delete({ where: { id: id } })
            const user = await prisma.user.findFirst({where: {id: order.userId}, include: {
                orders: {include: {item: true}}
            }})
            res.send(user)
        }
        else {
            res.status(400).send({ error: 'Order not found' })
        }
    } catch (error) {
        // @ts-ignore
        res.status(400).send(`<pre>${error.message}</pre>`)
    }
})

app.patch('/orders/:id', async (req,res) => {
    const id = Number(req.params.id)
    const quantity = req.body
    try{
        const order = await prisma.order.findUnique({where: {id}})

        if(order){
            await prisma.order.update({where: {id}, data: { quantity:quantity}})
        }else{
            res.send({error: 'You cannot update order'})
        }
    }catch(err){
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})

app.post('/orders', async (req, res) => {
    const { userId, itemId, quantity } = req.body

    try {
        const newOrder = await prisma.order.create(
            {
                data: {
                    userId, itemId, quantity
                }
            })
        res.send(newOrder)
    } catch (error) {
        // @ts-ignore
        res.status(400).send(`<pre>${error.message}</pre>`)
    }
})

app.get('/items', async (req, res) => {
    const items = await prisma.item.findMany({ include: { orders: { select: { userId: true, quantity: true } } } })
    res.send(items)
})

app.get('/items/:id', async (req, res) => {
    const id = Number(req.params.id)
    try {
        const item = await prisma.item.findUnique({ where: { id: id } })
        res.send(item)
    } catch (error) {
        // @ts-ignore
        res.status(400).send(`<pre>${error.message}</pre>`)
    }
})

app.delete('/items/:id', async (req, res) => {
    const id = Number(req.params.id)
    try {
        const item = await prisma.item.findUnique({ where: { id } })

        if (item) {
            await prisma.item.delete({ where: { id: id } })
            res.send(item)
        } else {
            res.status(400).send({ error: 'Item not found' })
        }
    } catch (error) {
        // @ts-ignore
        res.status(400).send(`<pre>${error.message}</pre>`)
    }
})

// app.post('/items', async (req, res) => {
//     const { title, image } = req.body

//     try {
//         const newItem = await prisma.item.create(
//             {
//                 data: {
//                     title, image
//                 }
//             })
//         res.send(newItem)
//     } catch (error) {
//         // @ts-ignore
//         res.status(400).send(`<pre>${error.message}</pre>`)
//     }
// })

app.listen(4000, () => {
    console.log('Server up: http://localhost:4000');
})