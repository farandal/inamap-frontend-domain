import Dashboard from '@mui/icons-material/Dashboard';
import Notifications  from '@mui/icons-material/Notifications';
import LocationCity  from '@mui/icons-material/LocationCity';
import Person  from '@mui/icons-material/Person';
import MenuOpenOutlined from '@mui/icons-material/MenuOpenOutlined';
import { IAppResourceGroupsIcon } from 'dash-admin/DASHAdmin';

const DASHGroupIcons: IAppResourceGroupsIcon = {
	Administración: <Dashboard />,
	'Logs y Notificaciones': <Notifications />,
	'Recursos de sistema': <LocationCity />,
	Usuarios: <Person />,
	Cliente: <Person />,
	Acciones: <MenuOpenOutlined />,
};

export default DASHGroupIcons;