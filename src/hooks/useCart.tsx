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
    if (storagedCart) {
      console.log(`storagedCart:${storagedCart}`)
      return JSON.parse(storagedCart);
    }
    return [];
  });


  const addProduct = async (productId: number) => {

    try {
      /* ProductId exists cart return true */
      const amount = cart.reduce((acc, product)=>{
        if (product.id === productId) {
          acc = product.amount;
        }
        return acc
      },0)

      console.log('product exists?'); console.log(amount)

      const hasStock = await hasProductInStock({productId, amount:1})

      console.log(hasStock)

      if (amount) {

        if(hasStock){
          updateProductAmount({productId, amount})
        }else{
          throw 'no product'
        }
        
      } else {
          console.log('addProduct'); console.log(cart)
          
          if(hasStock){
            await api.get(`/products/${productId}`).then((response) => {
              response.data.amount = 1
              console.log('addProduct2'); console.log(response.data)
              setCart([...cart,response.data])
              
              localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart)) 
            })
          }       
      }

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
    let hasStock = true;
    try {
      await api.get(`/stock/${productId}`).then((response) => {
        console.log(`product need: ${amount} stock: ${response.data.amount}`)
        if(amount > response.data.amount){
          hasStock = false
          toast.error('Quantidade solicitada fora de estoque');
        }
      })
    } catch {
      hasStock = false
      toast.error('Erro ao verificar a quantidade do produto');
    }
    return hasStock
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
