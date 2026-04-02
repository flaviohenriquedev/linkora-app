import Link from "next/link";
import {Container} from "@/components/ui/Container";
import {Button} from "@/components/ui/Button";
import {routesAdm} from "@/routes/routes.adm";

export default function AdminPage() {

    function renderRoutes() {
        return routesAdm.map((route, index) => {
            return (
                <Link href={route.href} key={route.label}>
                    <Button variant={`${index === 0 ? 'gold' : 'outline'}`} className="w-full justify-center">
                        {route.label}
                    </Button>
                </Link>
            )
        })
    }

    return (
        <main className="min-h-[calc(100vh-72px)]">
            <Container className="py-10">
                <h1 className="font-serif text-3xl text-text-primary">Painel Administrativo</h1>
                <p className="mt-3 max-w-2xl text-text-secondary">
                    Gestão de conteúdo: artigos, cursos, materiais e categorias.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {renderRoutes()}
                </div>
            </Container>
        </main>
    );
}
