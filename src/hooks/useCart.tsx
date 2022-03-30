import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
  const [cart, setCart] = useState<Product[]>(() => {
                const storagedCart = localStorage.getItem('@RocketShoes:cart')
                if (storagedCart) {
                  return JSON.parse(storagedCart);
                }
                return [];
                       });

  const addProduct = async (productId: number) => {
    try {
     let newCart = [...cart]; 
     const productUpdate = newCart.find(p => p.id===productId);
     const stock = await api.get<Stock>(`/stock/${productId}`)
                            .then(stock => stock.data)
     const stockAmount = stock.amount
     const amount = productUpdate ? productUpdate.amount : 0

     if(stockAmount <(amount+1)){
        toast.error('Quantidade solicitada fora de estoque');
        return;
     }else{
        if(productUpdate){
          productUpdate.amount +=1;
        }else{
          const newProduct = await api.get<Product>(`/products/${productId}`)
                                      .then(response => response.data);
          const newProductWithAmount = {...newProduct, amount: 1}                            
          newCart = [...newCart, newProductWithAmount];   
        }
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));                         
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartUpdate = [...cart];
       if(cartUpdate.some(p => p.id === productId)){
        const newCart:Product[] = cartUpdate.filter(p => p.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }else{
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }

  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount === 0) return;
      let newCart = [...cart];
      const productUpdate = newCart.find(p => p.id===productId);
      const stock = await api.get<Stock>(`/stock/${productId}`)
                             .then(stock => stock.data)
      if(productUpdate){
          if(amount>stock.amount){
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }else{
            productUpdate.amount = amount; 
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          }
      }else{
        throw Error();
      }
    }catch {
      toast.error('Erro na alteração de quantidade do produto');
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
