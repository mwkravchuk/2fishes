import { PrismaClient, GrindOption, BagSize } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        slug: "ethiopia-yirgacheffe",
        name: "Ethiopia Yirgacheffe",
        description: "A bright washed Ethiopian coffee with a floral, citrus-forward cup.",
        origin: "Yirgacheffe, Ethiopia",
        flavorNotes: ["jasmine", "citrus", "honey"],
        priceCents: 2200,
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
        isActive: true,
        availableGrinds: [GrindOption.whole_bean],
        availableSizes: [BagSize.oz12],
      },
      {
        slug: "colombia-huila",
        name: "Colombia Huila",
        description: "Balanced and sweet with a soft body and approachable profile.",
        origin: "Huila, Colombia",
        flavorNotes: ["caramel", "red fruit", "cocoa"],
        priceCents: 2000,
        imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        isActive: true,
        availableGrinds: [GrindOption.whole_bean],
        availableSizes: [BagSize.oz12],
      },
      {
        slug: "guatemala-huehuetenango",
        name: "Guatemala Huehuetenango",
        description: "A structured cup with chocolate depth and subtle fruit.",
        origin: "Huehuetenango, Guatemala",
        flavorNotes: ["chocolate", "orange", "brown sugar"],
        priceCents: 2100,
        imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e",
        isActive: true,
        availableGrinds: [GrindOption.whole_bean],
        availableSizes: [BagSize.oz12],
      },
    ],
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