import StaticLayout from 'dash-admin/src/default-theme/StaticLayout';
const Legal = (props) => {

    const {panelSettings} = props;

	return <StaticLayout>
		<>
			<h1 className='title'>
				TITLE
			</h1>
			
			<h2>SUB TITLE</h2>
			
			<p className='text'>
				Content
			</p>
		</>
	</StaticLayout>;
		
};


export default Legal;
