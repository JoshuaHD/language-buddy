import { InertiaLinkProps, Link } from '@inertiajs/react';

type LinkButton = {

} & InertiaLinkProps
export function LinkButton(props: LinkButton) {
    return (
        <Link
            {...props}
            className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
        >
            {props.children}
        </Link>
    );
}
