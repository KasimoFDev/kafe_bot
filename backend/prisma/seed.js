import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  if (count === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: 'Margarita',
          description: 'Klassik pitsa: pomidor sousi, mozzarella pishlog‘i va yangi rayhon barglari.',
          price: 65000,
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60'
        },
        {
          name: 'Peperoni',
          description: 'Achchiq pepperoni sosiskalari, mozzarella pishlog‘i va pomidor sousi.',
          price: 75000,
          image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60'
        },
        {
          name: 'Qazi pitsa',
          description: 'Milliy uslubdagi pitsa: dudlangan qazi, piyoz, mozzarella va pomidor sousi.',
          price: 85000,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60'
        },
        {
          name: 'Pishloqli pitsa',
          description: 'Haqiqiy pishloqxo‘rlar uchun: to‘rt xil mazali pishloq uyg‘unligi.',
          price: 70000,
          image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60'
        }
      ]
    });
    console.log('Mahsulotlar muvaffaqiyatli qo‘shildi!');
  } else {
    console.log('Mahsulotlar allaqachon mavjud.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
