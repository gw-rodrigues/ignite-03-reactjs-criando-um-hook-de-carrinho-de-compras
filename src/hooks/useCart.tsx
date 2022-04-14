import { error } from 'console';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { ProductList } from '../pages/Home/styles';
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
    console.log(`storagedCart:`)
    console.log(storagedCart)
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });



  const addProduct = async (productId: number) => {

    try {

      console.log('addProduct cart before:'); console.log(cart)

      /* ProductId exists cart return true */
      let amount = cart.reduce((acc, product) => {
        if (product.id === productId) { acc = product.amount }
        return acc
      }, 0)
      console.log('product exists?'); console.log(amount)

      if (await hasProductInStock({ productId, amount: amount + 3 }) < 0) {
        console.log('nao tem mais sctock')
        return
      }

      if (amount) {
        updateProductAmount({ productId, amount: amount + 1 })
        return
      }

      const product = await api.get(`/products/${productId}`).then((response) => response.data)
      product.amount = 1
      console.log('new product:'); console.log(product)
      setCart([...cart, product])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const hasProductInStock = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      amount = await api.get(`/stock/${productId}`).then((response) => {
        console.log(`product need: ${amount} stock: ${response.data.amount}`)
        return (response.data.amount) - amount
      })
    } catch {
      amount = -1
      toast.error('Erro ao verificar a quantidade do produto');
    }
    console.log(amount)
    if (amount < 0) { toast.error('Quantidade solicitada fora de estoque'); }
    return amount
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
