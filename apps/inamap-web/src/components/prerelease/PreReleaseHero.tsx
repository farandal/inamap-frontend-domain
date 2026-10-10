import { useTranslate } from '@app/components/hooks/usePolyglotTranslation';
import PreReleaseSignupForm from './PreReleaseSignupForm';
import HeroSection from '@app/components/theme/components/hero/HeroSection';
import HeroAnimation from '@app/components/theme/components/hero/HeroAnimation';

/**
 * Pre-release landing hero: replaces the "CREATE STORE" trial CTA with the
 * coming-soon announcement and the email capture form.
 */
export default function PreReleaseHero() {
    const translate = useTranslate();

    return (
        <HeroSection animation={<HeroAnimation />}>
            <h1>
                <span>{translate('landing.prerelease.title')}</span>
            </h1>
            <p className="lead">
                {translate('landing.prerelease.description')}
            </p>
            <p className="lead" style={{ fontWeight: 600 }}>
                {translate('landing.prerelease.callToAction')}
            </p>

            <div className="hero-signup-form mt-4">
                <PreReleaseSignupForm />
            </div>
        </HeroSection>
    );
}
