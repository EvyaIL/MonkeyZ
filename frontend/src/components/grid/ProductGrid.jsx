import ProductCard from "../product/ProductCard";

const ProductGrid = ({ items, onEdit, onDelete, onClick }) => {
    if (!items.length) {
        return <p className="text-gray-400 text-center">No items available.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item) => (
                <ProductCard 
                    key={item.id} 
                    product={item} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    onClick={() => onClick(item.id)} 
                    otherStyle={"xl:scale-90"}
                />
            ))}
        </div>
    );
};

export default ProductGrid;
