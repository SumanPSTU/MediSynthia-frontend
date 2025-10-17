import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient.js";
import { Link } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosClient.get("/products");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Medicines</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded p-4 shadow hover:shadow-lg transition">
            <img src={product.image} alt={product.name} className="h-40 w-full object-cover mb-2"/>
            <h2 className="font-bold">{product.name}</h2>
            <p className="text-gray-600">{product.category}</p>
            <p className="text-blue-600 font-semibold">${product.price}</p>
            <Link
              to={`/products/${product._id}`}
              className="mt-2 inline-block bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
