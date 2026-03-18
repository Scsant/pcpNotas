import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelCargoPolo = () => <TransportadoraPanel transportadora={getTransportadoraConfig(1)} />;

export default PainelCargoPolo;
