import { useState, useContext } from "react";
import { useQuery, useMutation } from '@apollo/client';
import Link from "next/link";
import { v4 } from 'uuid';
import cx from 'classnames';

import { AppContext } from "../context/AppContext";
import { getFormattedCart } from "../../functions";
import GET_CART from "../../queries/get-cart";
import ADD_TO_CART from "../../mutations/add-to-cart";

const AddToCart = (props) => {

    const { product } = props;

    const productQryInput = {
        clientMutationId: v4(), // Generate a unique id.
        productId: product.productId,
    };

    const [cart, setCart] = useContext(AppContext);
    const [showViewCart, setShowViewCart] = useState(false);
    const [requestError, setRequestError] = useState(null);

    // Get Cart Data.
    const { data, refetch, error: getCartError } = useQuery(GET_CART, {
        notifyOnNetworkStatusChange: true,
        onCompleted: () => {
            // Log data for debugging
            console.log('Cart data received:', data);

            const updatedCart = getFormattedCart(data);
            localStorage.setItem('woo-next-cart', JSON.stringify(updatedCart));
            setCart(updatedCart);

            // Log updated cart for debugging
            console.log('Updated Cart:', updatedCart);
        },
        onError: (error) => {
            console.error('GET_CART error:', error);
        }
    });

    // Add to Cart Mutation.
    const [addToCart, {
        data: addToCartRes,
        loading: addToCartLoading,
        error: addToCartError
    }] = useMutation(ADD_TO_CART, {
        variables: {
            input: productQryInput,
        },
        onCompleted: () => {
            console.log('Adding to cart completed, refetching cart...');
            refetch();  // Refetch the cart data after adding to cart

            setShowViewCart(true); // Show the "View Cart" button
        },
        onError: (error) => {
            console.error('ADD_TO_CART error:', error);
            setRequestError(error?.graphQLErrors?.[0]?.message ?? '');
        }
    });

    const handleAddToCartClick = async () => {
        setRequestError(null); // Reset any previous error message
        await addToCart(); // Add the product to the cart
    };

    return (
        <div>
            {/* Check if it's an external product, and provide a link if so */}
            {"ExternalProduct" === product.__typename ? (
                <a href={product?.externalUrl ?? '/'} target="_blank"
                   className="px-3 py-1 rounded-sm mr-3 text-sm border-solid border border-current inline-block hover:bg-purple-600 hover:text-white hover:border-purple-600">
                    Buy now
                </a>
            ) : (
                <button
                    disabled={addToCartLoading}
                    onClick={handleAddToCartClick}
                    className={cx(
                        'px-3 py-1 rounded-sm mr-3 text-sm border-solid border border-current',
                        { 'hover:bg-purple-600 hover:text-white hover:border-purple-600': !addToCartLoading },
                        { 'opacity-50 cursor-not-allowed': addToCartLoading }
                    )}
                >
                    {addToCartLoading ? 'Adding to cart...' : 'Add to cart'}
                </button>
            )}

            {/* Show the "View Cart" button when an item has been added */}
            {showViewCart && (
                <Link href="/cart">
                    <button
                        className="px-3 py-1 rounded-sm text-sm border-solid border border-current inline-block hover:bg-purple-600 hover:text-white hover:border-purple-600">
                        View Cart
                    </button>
                </Link>
            )}

            {/* Display any errors if they occur */}
            {requestError && <p className="text-red-500">{requestError}</p>}

            {/* Log any errors for debugging */}
            {getCartError && console.error('GET_CART error:', getCartError)}
            {addToCartError && console.error('ADD_TO_CART error:', addToCartError)}
        </div>
    );
};

export default AddToCart;
