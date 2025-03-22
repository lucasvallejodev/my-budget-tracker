import { PropsWithChildren, ReactNode } from "react";

const Card = ({ children }: PropsWithChildren) => (
  <div className="bg-black text-white rounded-3xl p-6 overflow-hidden transition-all duration-300 ease-in-out animate-slide-up" style={{ animationDelay: '0.1s' }}>
    { children }
  </div>
)

export default Card;