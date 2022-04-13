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
      console.log(storagedCart)
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      /* ProductId exists cart return true */
      const hasProductInCard = cart.reduce((acc, product, index)=>{
        if (product.id === productId) {
          acc.productIndex = index; acc.productExist = true;
        }
        return acc
      },{productIndex: -1, productExist: false})

      console.log('product exists?'); console.log(hasProductInCard)

      
      

      if (hasProductInCard.productExist) {
        const amount = cart[hasProductInCard.productIndex].amount;
        const enoughProductInStock = hasProductInStock(productId, amount)
        console.log(enoughProductInStock.finally)
        updateProductAmount({productId, amount})
      } else {
          await api.get(`/products/${productId}`).then((response) => {
            response.data.amount = 1
            const enoughProductInStock = hasProductInStock(productId, response.data.amount) 
            setCart([...cart,response.data])  
          })
          
      }

      console.log('addProduct'); console.log(cart)
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

  const hasProductInStock = async (productId: number, productAmount: number) => {
    try {
      await api.get(`/stock/${productId}`).then((response) => {
        console.log(`product stock: ${productAmount} > ${response.data.amount} ?`)
        if(productAmount > response.data.amount){
          toast.error('Quantidade solicitada fora de estoque');
          return false
        }
      })
      return true
    } catch {
      return false
      toast.error('Erro ao verificar a quantidade do produto');
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
