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
    try {
      if(productId <= 0) { throw 'invalid value' }
      const amountInCart = cart.reduce((acc, product) => {
        if (product.id === productId) { acc = product.amount }
        return acc
      }, 0)

      if (amountInCart) {
        updateProductAmount({ productId, amount: amountInCart + 1 })
      } else {

        const product = await api.get(`/products/50`)
        .then((response) => (response.data))
        product.amount = 1

        if (!await hasProductInStock({ productId, amount: product.amount })) { return }

        const newCart = [...cart, product]

        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(productId <= 0) { throw 'invalid value' }
      const newCart = cart.filter((product) => { 
        if (product.id !== productId) { 
          return product 
        } 
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
      if(amount <= 0 || productId <= 0) { throw 'invalid value' }
      if (!await hasProductInStock({ productId, amount })) { return }

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
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      await api.get(`/stock/${productId}`).then((response) => {
        if ((response.data.amount - amount) < 0) {
          throw 'out-of-stock'
        }
      })
    } catch (error) {
      if (error == "out-of-stock") {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro ao verificar a quantidade do produto');
      }
      return false
    }
    return true
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
