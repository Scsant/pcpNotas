import TransportadoraPanel from "../components/TransportadoraPanel";
import { getTransportadoraConfig } from "../lib/transportadoras";

const PainelNepomuceno = () => <TransportadoraPanel transportadora={getTransportadoraConfig(3)} />;

export default PainelNepomuceno;
