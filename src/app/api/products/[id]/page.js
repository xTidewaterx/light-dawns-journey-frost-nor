'use client'

import { notFound } from "next/navigation";
import { CartProvider, useCart } from "react-use-cart";


async function getProduct(id) {
    
    
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products?id=${id}`);

    if (!res.ok) {
        return null; // Handle cases where product doesn't exist
    }

    return res.json();
}

export default async function ProductDetail({ params }) {


    params = await params;


        
        const product = await getProduct(params?.id); 
        console.log("specific product by id [id]/page.js:", product)

    if (!product) {
        notFound(); // If no product found, redirect to Next.js's built-in 404 page
    }
    const {addItem} = useCart();
    return (
      <CartProvider>
        <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
            <h1>{product.name} </h1>
            <p>{product.description || "No description available"}</p>
            <button onClick={() => addItem(product)}>Add to cart</button>
       
            {product.images && product.images.length > 0 && (
                <img
                    src={product.images[0]}
                    alt={product.name}
                    style={{ width: "100%", height: "auto", borderRadius: "10px" }}
                />
      

            )}
        </div>
      </CartProvider>  
    );

}