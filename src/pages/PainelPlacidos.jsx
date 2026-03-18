import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelPlacidos = () => <TransportadoraPanel transportadora={getTransportadoraConfig(6)} />;

export default PainelPlacidos;
