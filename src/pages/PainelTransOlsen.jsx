import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelTransOlsen = () => <TransportadoraPanel transportadora={getTransportadoraConfig(4)} />;

export default PainelTransOlsen;
