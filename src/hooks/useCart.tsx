import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  /* remove localStore data */
  //localStorage.removeItem('@RocketShoes:cart')

  //buscar dados localStorage - verifica se existe valores - se nao retorna [vazio]
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
 
    async function getProduct(){
      const product = await api.get(`/products/${productId}`)
        .then((response) => {
          response.data.amount = 1
          return response.data
      })
      return product
    }

    try {

      if (hasProductInCart(productId)) {

        const productCartAmount = cart.reduce((acc,product) => { 
          if (product.id === productId) { acc = product.amount } 
          return acc
        }, 0)
        updateProductAmount({ productId, amount: productCartAmount+1 })

      } else {
        
        const [product, hasStock] = await Promise.all([getProduct(), hasProductInStock({ id:productId, amount:1 })])

        if(!hasStock) { return }

        const newCart = [...cart, product]
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      if(!hasProductInCart(productId)){ throw new Error() }

      const newCart = cart.filter((product) => { 
        return product.id !== productId 
      })

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(!hasProductInCart(productId) || amount <= 0){ throw new Error() }
      if (!await hasProductInStock({ id:productId, amount })) { return }

      const newCart = cart.map((product) => { 
        if (product.id === productId) { product.amount = amount } 
        return product
      })

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const hasProductInStock = async ({
    id,
    amount,
  }: Stock) => {
    try {

      await api.get(`/stock/${id}`).then((response) => {
        if ((response.data.amount - amount) < 0) {
          throw String('out-of-stock')
        }
      })

    } catch (err) {

      if (err === "out-of-stock") {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro ao verificar a quantidade do produto');
      }
      return false

    }
    return true
  };

  const hasProductInCart = (productId: number) => {
    try {

      const productExist = cart.reduce((acc,product) => { 
        if (product.id === productId) { acc = true } 
        return acc
      }, false)
      return productExist
      
    } catch {
      return false
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  return context;
}
