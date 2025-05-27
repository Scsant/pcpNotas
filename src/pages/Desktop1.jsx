import "./Desktop1.css";

export const Desktop1 = ({ className, ...props }) => {
  return (
    <div className={"desktop-1 " + className}>
      <div className="rectangle-1"></div>
      <div className="rectangle-8"></div>
      <img className="bracell-logo-2020-1" src="bracell-logo-2020-10.png" />
      <div className="rectangle-2"></div>
      <div className="rectangle-3"></div>
      <div className="rectangle-4"></div>
      <div className="rectangle-5"></div>
      <div className="rectangle-6"></div>
      <div className="rectangle-7"></div>
      <div className="login">LOGIN </div>
      <div className="email">EMAIL </div>
      <div className="senha">SENHA </div>
      <div className="entrar">ENTRAR </div>
      <div className="logout">LOGOUT </div>
      <div className="esqueci-a-senha">Esqueci a senha </div>
    </div>
  );
};
