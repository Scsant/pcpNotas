import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelVDA = () => <TransportadoraPanel transportadora={getTransportadoraConfig(8)} />;

export default PainelVDA;
