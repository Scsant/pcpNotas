import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelSerranalog = () => <TransportadoraPanel transportadora={getTransportadoraConfig(7)} />;

export default PainelSerranalog;
