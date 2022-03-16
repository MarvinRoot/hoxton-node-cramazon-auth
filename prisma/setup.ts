import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const users = [
    {
        name: 'Marvin',
        email: 'marvin@mail.com'
    },
    {
        name: 'LeBron',
        email: 'lebron@mail.com'
    },
    {
        name: 'Kurama',
        email: 'kurama@mail.com'
    }
]

const items = [
    {
        title: 'lipstick',
        image: 'lipstick.jpg'
    },
    {
        title: 'basketball',
        image: 'basketball.jpg'
    },
    {
        title: 'pants',
        image: 'pants.jpg'
    },
    {
        title: 't-shirt',
        image: 'tshirt.jpg'
    }
]

const orders = [
    {
        userId: 1,
        itemId: 2,
        quantity: 1
    },
    {
        userId: 1,
        itemId: 3,
        quantity: 2
    },
    {
        userId: 2,
        itemId: 4,
        quantity: 3
    },
    {
        userId: 3, 
        itemId: 1,
        quantity: 4
    }
]

async function createStuff() {
    for(const user of users){
        await prisma.user.create({data: user})
    }

    for(const item of items){
        await prisma.item.create({data: item})
    }

    for(const order of orders){
        await prisma.order.create({data: order})
    }
}

createStuff()