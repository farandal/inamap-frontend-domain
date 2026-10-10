import { Alert, Box, Button, TextField } from '@mui/material';
import { useAxios } from 'dash-axios-hook';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const getUrlParamsObject = (searchParams: any) => {
	let params: Record<string, any> = {};
	for (const entry of searchParams) {
		const [param, value] = entry;
		params = { ...params, [param]: value };
	}
	return Object.keys(params).length > 0 ? params : null;
};


interface ChangePasswordProps {
   
    onAuthChange?: (authenticated: any) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({
   
}) => {
	const navigate = useNavigate();
	let [searchParams] = useSearchParams();
	// @ts-ignore - URLSearchParams.entries() type issue
	const urlQuery: any = getUrlParamsObject(searchParams.entries());
	// Fix: Remove any trailing non-email characters (like parenthesis) from email param
	const cleanEmail = urlQuery?.email ? decodeURIComponent(urlQuery.email).replace(/[)\]\s]+$/, '') : '';

	const [password, setPassword] = useState('');
	const [rePassword, setRePassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const axios = useAxios();

	useEffect(() => {
		if (!urlQuery?.token || !urlQuery?.email) {
			navigate('/login');
		}
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (password === rePassword) {
			setError('');
			setLoading(true);
			try {
				const { data } = await axios.post(`password/reset`, {
					password,
					password_confirmation: rePassword,
					token: urlQuery?.token,
					email: cleanEmail,
				});
				setSuccess(true);
				// Optionally show notification here
			} catch (error: any) {
				let errorMsg = 'Error al cambiar contraseña';
				if (error?.response?.data) {
					const resp = error.response.data;
					// Prefer error from errors.email, then message, then fallback
					if (resp.errors && resp.errors.email && resp.errors.email.length > 0) {
						errorMsg = resp.errors.email[0];
					} else if (resp.message) {
						errorMsg = resp.message;
					}
				} else if (error?.message) {
					errorMsg = error.message;
				}
				setError(errorMsg);
			} finally {
				setLoading(false);
			}
		} else {
			setError('Las contraseñas no coinciden');
		}
	};

	return (
		<Box>
			{success ? (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: 3,
						borderRadius: 2,
						p: 4,
						minWidth: 320,
						minHeight: 200,
						bgcolor: 'background.paper',
						mt: 8,
						mx: 'auto',
					}}
				>
					<h1 className="dash-app-login-form-title" style={{ margin: 0 }}>Contraseña cambiada</h1>
					<Alert severity="success" sx={{ mt: 2, mb: 2 }}>
						Tu contraseña ha sido cambiada correctamente.
					</Alert>
					<Button
						variant="contained"
						color="primary"
						onClick={() => navigate('/login')}
						sx={{ mt: 2 }}
					>
						Ir al Login
					</Button>
				</Box>
			) : (
				<form 
					onSubmit={handleSubmit} 
					className="dash-app-login-form"
					autoComplete="on"
					method="post"
				>
					<h1 className="dash-app-login-form-title">Cambiar Contraseña</h1>

					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					<div className="dash-app-form-item">
						<TextField
							fullWidth
							label="Contraseña"
							placeholder="Contraseña"
							required
							type="password"
							value={password}
							onChange={(e) => {
								setError('');
								setPassword(e.target.value);
							}}
							className="dash-app-form-item-input"
							disabled={loading}
						/>
					</div>

					<div className="dash-app-form-item">
						<TextField
							fullWidth
							label="Repetir Contraseña"
							placeholder="Repetir Contraseña"
							required
							type="password"
							value={rePassword}
							onChange={(e) => {
								setError('');
								setRePassword(e.target.value);
							}}
							className="dash-app-form-item-input"
							disabled={loading}
						/>
					</div>

					<div className="dash-app-form-item mt-1">
						<Button
							type="submit"
							variant="contained"
							className="submit"
							disabled={loading}
							sx={{ mb: 2, width: '100%' }}
						>
							{loading ? 'Cargando...' : 'Cambiar Contraseña'}
						</Button>
					</div>
				</form>
			)}
		</Box>
	);
};

export default ChangePassword;
