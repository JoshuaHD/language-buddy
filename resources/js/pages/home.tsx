import { Link, usePage } from '@inertiajs/react';
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
                <LinkButton
                    href={dashboard()}
                >
                    Dashboard
                </LinkButton>
            ) : (
                <>
                    <LinkButton href={login()}>Login</LinkButton>
                    {canRegister && (
                        <LinkButton
                            href={register()}
                        >
                            Register
                        </LinkButton>
                    )}
                </>
            )}

            <main>home page</main>

            {canRegister && (
                <Link
                    href={register()}
                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                >
                    Register
                </Link>
            )}
        </div>
    );
}
