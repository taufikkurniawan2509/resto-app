import Image from "next/image";

const menuList = [
  {
    id: 1,
    name: "Nasi Goreng",
    price: 25000,
    image: "https://i0.wp.com/resepkoki.id/wp-content/uploads/2016/09/Resep-Nasi-Goreng-Ikan-Teri.jpg",
  },
  {
    id: 2,
    name: "Es Teh Manis",
    price: 8000,
    image: "https://i0.wp.com/resepkoki.id/wp-content/uploads/2016/09/Resep-Nasi-Goreng-Ikan-Teri.jpg",
  },
  {
    id: 3,
    name: "Spaghetti",
    price: 30000,
    image: "https://i0.wp.com/resepkoki.id/wp-content/uploads/2016/09/Resep-Nasi-Goreng-Ikan-Teri.jpg",
  },
];


export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-rose-600 mb-6">
        Daftar Menu Resto 🍽️
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {menuList.map((menu) => (
          <div
            key={menu.id}
            className="border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition"
          >
            <img src={menu.image} alt={menu.name} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{menu.name}</h2>
              <p className="text-sm text-gray-500">Rp {menu.price.toLocaleString()}</p>
              <button className="mt-3 bg-rose-500 text-white px-4 py-1 rounded hover:bg-rose-600">
                Pesan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
