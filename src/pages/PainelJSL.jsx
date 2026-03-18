import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelJSL = () => <TransportadoraPanel transportadora={getTransportadoraConfig(5)} />;

export default PainelJSL;
