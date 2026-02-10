export interface CartItem {
  id: string
  name: string
  price: number
  oldPrice?: number
  image: string
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
}

export class CartManager {
  private cart: Cart

  constructor() {
    this.cart = this.loadCart()
  }

  private loadCart(): Cart {
    if (typeof window === "undefined") {
      return { items: [], total: 0 }
    }

    const savedCart = localStorage.getItem("wepink_cart")
    if (!savedCart) {
      return { items: [], total: 0 }
    }

    const cart = JSON.parse(savedCart)
    return cart
  }

  private saveCart(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("wepink_cart", JSON.stringify(this.cart))
    }
  }

  addItem(product: Omit<CartItem, "quantity">): Cart {
    const existingItem = this.cart.items.find((item) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      this.cart.items.push({
        ...product,
        quantity: 1,
      })
    }

    this.calculateTotal()
    this.saveCart()

    // Track AddToCart event
    if (typeof window !== "undefined" && (window as any).trackAddToCart) {
      ;(window as any).trackAddToCart(product.price, "BRL", product.id, product.name)
    }

    return this.cart
  }

  removeItem(productId: string): Cart {
    this.cart.items = this.cart.items.filter((item) => item.id !== productId)
    this.calculateTotal()
    this.saveCart()
    return this.cart
  }

  updateQuantity(productId: string, quantity: number): Cart {
    const item = this.cart.items.find((item) => item.id === productId)

    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId)
      } else {
        item.quantity = quantity
        this.calculateTotal()
        this.saveCart()
      }
    }

    return this.cart
  }

  private calculateTotal(): void {
    this.cart.total = this.cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity
    }, 0)
  }

  getCart(): Cart {
    return this.cart
  }

  getItemCount(): number {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  clearCart(): void {
    this.cart = { items: [], total: 0 }
    this.saveCart()
  }

  formatPrice(price: number): string {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }
}
