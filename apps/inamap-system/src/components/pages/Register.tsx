/* eslint-disable jsdoc/check-tag-names */
import React, { createRef, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Button, TextField, Grid, IconButton, Alert } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { useNotify } from 'react-admin';
import ReCAPTCHA from 'react-google-recaptcha';
import { DASH_REDUX_ACTIONS } from 'dash-admin-state';
import DictionaryContext from 'dash-admin/contexts/dictionary/DictionaryContext';
import { useAxios } from 'dash-axios-hook';
import { useDialog } from 'dash-dialog';
import {DASHAppConstants} from 'dash-constants';
import { RutValidator } from 'dash-admin/utils/validators';

interface RegisterPageProps {

}

const RegisterPage: React.FC<RegisterPageProps> = ({
	
}) => {
	const enableRecaptcha: boolean = DASHAppConstants.system.RECAPTCHA_ENABLED;
	const recaptchaRef = createRef<ReCAPTCHA>();
	const [recpatcha, setRecaptcha] = useState(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const dispatch = useDispatch();
	const dialog = useDialog();
	const dict = React.useContext(DictionaryContext);
	const navigate = useNavigate();
	const {
		register,
		handleSubmit,
		setError: setFormError,
		clearErrors,
		formState: { errors },
	} = useForm();
	const axios = useAxios();
	const notify = useNotify();

	const onChangeRecaptcha = (value: string) => {
		clearErrors('g-recaptcha-response');
		setRecaptcha(value);
	};

	useEffect(() => {
		dispatch(
			DASH_REDUX_ACTIONS.updatePage({
				title: null,
			}),
		);
	}, []);

	async function onSubmit(data) {
		setIsLoading(true);
		setError(null);

		if (data.clientname) {
			const bracketed_name = 'client[name]';
			data[bracketed_name] = data.clientname;
			delete data.clientname;
		}

		if (enableRecaptcha) {
			const recaptchaValue =
				recaptchaRef.current && recaptchaRef.current.getValue
					? recaptchaRef.current.getValue()
					: recpatcha;
			data = { ...data, 'g-recaptcha-response': recaptchaValue };
		}

		try {
			const response = await axios.post('/auth/user/register', data, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			if (response.status >= 200) {
				notify('El usuario ha sido registrado', { type: 'success' });
				navigate('/');
			} else {
				setError('Ha ocurrido un error, inténtelo nuevamente');
			}
		} catch (error: any) {
			for (const key in error) {
				if (key === 'client.name') {
					setFormError('clientname', {
						type: 'custom',
						message: dict.get(error[key], true),
					});
				}
				setFormError(key, { type: 'custom', message: dict.get(error[key], true) });
			}
		} finally {
			setIsLoading(false);
		}
	}

	return (

			<form onSubmit={handleSubmit(onSubmit)} className="dash-app-login-form" autoComplete="on">
				<Grid container spacing={2}>
					<Grid item xs={2}>
						<IconButton
							color="primary"
							onClick={() => navigate('/')}
						>
							<HomeIcon />
						</IconButton>
					</Grid>
					<Grid item xs={10}>
						<h1 className="dash-app-login-form-title">Crear cuenta</h1>
					</Grid>
				</Grid>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				<div className="dash-app-form-item">
					<TextField
						label="Email"
						placeholder="Email"
						required
						{...register('email')}
						type="email"
						className="dash-app-form-item-input"
						error={!!errors.email}
						helperText={errors.email?.message}
					/>
				</div>

				<div className="dash-app-form-item">
					<TextField
						label="Nombre eCommerce"
						placeholder="Nombre eCommerce"
						required
						{...register('clientname')}
						className="dash-app-form-item-input"
						error={!!errors.clientname}
						helperText={errors.clientname?.message}
					/>
				</div>

				<div className="dash-app-form-item">
					<TextField
						label="Rut"
						placeholder="11.111.111-1"
						required
						{...register('public_id', { validate: RutValidator })}
						className="dash-app-form-item-input"
						error={!!errors.public_id}
						helperText={errors.public_id?.message || (errors.public_id && 'Rut inválido')}
					/>
				</div>

				<div className="dash-app-form-item">
					<TextField
						label="Nombre"
						placeholder="Nombre"
						required
						{...register('name')}
						className="dash-app-form-item-input"
						error={!!errors.name}
						helperText={errors.name?.message}
					/>
				</div>

				<div className="dash-app-form-item">
					<TextField
						label="Apellidos"
						placeholder="Apellidos"
						required
						{...register('lastname')}
						className="dash-app-form-item-input"
						error={!!errors.lastname}
						helperText={errors.lastname?.message}
					/>
				</div>

				<div className="dash-app-form-item">
					<TextField
						label="Contraseña"
						placeholder="Contraseña"
						type="password"
						required
						{...register('password')}
						className="dash-app-form-item-input"
						error={!!errors.password}
						helperText={errors.password?.message}
					/>
				</div>

				<div className="dash-app-form-item">
					<TextField
						label="Confirmar contraseña"
						placeholder="Confirmar contraseña"
						type="password"
						required
						{...register('confirm_password')}
						className="dash-app-form-item-input"
						error={!!errors.confirm_password}
						helperText={errors.confirm_password?.message}
					/>
				</div>

				<div className="dash-app-form-item">
					<TextField
						label="Teléfono de Contacto"
						placeholder="+569 1234 5678"
						required
						{...register('phone')}
						className="dash-app-form-item-input"
						error={!!errors.phone}
						helperText={errors.phone?.message}
					/>
				</div>

				{enableRecaptcha && (
					<div className="dash-app-form-item">
						<ReCAPTCHA
							ref={recaptchaRef}
							sitekey={DASHAppConstants.system.RECAPTCHA_TOKEN}
							onChange={onChangeRecaptcha}
						/>
						{errors['g-recaptcha-response'] && (
							<span style={{ color: 'red' }}>
								{errors['g-recaptcha-response'].message}
							</span>
						)}
					</div>
				)}

				<div className="dash-app-form-item mt-1">
					<Button
						type="submit"
						variant="contained"
						fullWidth
						disabled={isLoading || (!recpatcha && enableRecaptcha)}
						sx={{ mb: 2 }}
					>
						{isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
					</Button>
				</div>

				<div className="dash-app-form-item">
					<Button
						variant="text"
						fullWidth
						onClick={() => {
							clearErrors();
							navigate('/');
						}}
					>
						Cancelar
					</Button>
				</div>
			</form>

	);
};

export default RegisterPage;
