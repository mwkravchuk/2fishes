export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      {/* Top nav */}
      <div className="flex text-sm justify-end">
        <div className="flex gap-4">
          <span>SHOP</span>
          <span>ABOUT</span>
        </div>
      </div>

      {/* Huge title */}
      <h1 className="mt-8 text-[120px] leading-none font-bold tracking-tight">
        2FISHES
      </h1>

      {/* Split section */}
      <div className="mt-16 grid grid-cols-2 gap-12 items-center">
        <div className="text-xl leading-relaxed">
          <p>Small batch roasted coffee.</p>
          <p>Roasted weekly. Built intentionally.</p>
        </div>

        <div className="bg-gray-200 h-[600px] mr-16" />
      </div>
    </main>
  )
}