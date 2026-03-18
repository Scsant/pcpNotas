import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelGarbuio = () => <TransportadoraPanel transportadora={getTransportadoraConfig(2)} />;

export default PainelGarbuio;
