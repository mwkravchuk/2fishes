import "dotenv/config";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { slug: "ethiopia-light-roast" },
    update: {},
    create: {
      slug: "ethiopia-light-roast",
      name: "Ethiopia Light Roast",
      description: "Bright and citrus-forward with floral notes and a clean finish.",
      priceCents: 2000,
      imageUrl:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "house-espresso" },
    update: {},
    create: {
      slug: "house-espresso",
      name: "House Espresso",
      description: "Chocolatey, balanced, and easy to drink every day.",
      priceCents: 1800,
      imageUrl:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "colombia-rotation" },
    update: {},
    create: {
      slug: "colombia-rotation",
      name: "Colombia Rotation",
      description: "Soft fruit sweetness and caramel in a rotating single-origin roast.",
      priceCents: 2200,
      imageUrl:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });