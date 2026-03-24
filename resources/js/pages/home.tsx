import { usePage } from '@inertiajs/react';
import { LinkButton } from '@/components/ui/linkButton';
import { dashboard, login, register } from '@/routes';

type HomePage = {
    canRegister: boolean;
};

export default function HomePage({ canRegister }: HomePage) {
    const { auth } = usePage().props;

    return (
        <div>
            {auth.user ? (
                <LinkButton href={dashboard()}>Dashboard</LinkButton>
            ) : (
                <>
                    <LinkButton href={login()}>Login</LinkButton>
                    {canRegister && (
                        <LinkButton href={register()}>Register</LinkButton>
                    )}
                </>
            )}

            <main>home page</main>
        </div>
    );
}
