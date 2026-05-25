import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

type EcosystemWebsiteSeed = {
	slug: string;
	websiteUrl: string;
};

const ecosystemWebsites: EcosystemWebsiteSeed[] = [
	{
		slug: "bid-banco-interamericano-de-desarrollo",
		websiteUrl: "https://www.iadb.org/es",
	},
	{
		slug: "caf-banco-de-desarrollo-de-america-latina",
		websiteUrl: "https://www.caf.com/",
	},
	{
		slug: "cooperacion-suiza-en-peru",
		websiteUrl: "https://www.eda.admin.ch/lima",
	},
	{
		slug: "nexum-incubadora-de-empresas-pucp",
		websiteUrl: "https://cide.pucp.edu.pe/",
	},
	{
		slug: "fundacion-bbva",
		websiteUrl: "https://fundacionbbva.pe/",
	},
	{
		slug: "fundacion-romero",
		websiteUrl: "https://fundacionromero.org.pe/",
	},
	{
		slug: "fundacion-telefonica",
		websiteUrl: "https://educared.fundaciontelefonica.com.pe/",
	},
	{
		slug: "hub-de-innovacion-minera-del-peru",
		websiteUrl: "https://hubinnovacionminera.pe/",
	},
	{
		slug: "kunan-2",
		websiteUrl: "https://www.kunan.com.pe/",
	},
	{
		slug: "pecap-asociacion-peruana-de-capital-semilla-y-emprendedor",
		websiteUrl: "https://www.pecap.pe/",
	},
	{
		slug: "peruincuba",
		websiteUrl: "https://peruincuba.net/",
	},
	{
		slug: "piura-innovadora",
		websiteUrl: "https://www.piurainnovadora.pe/",
	},
	{
		slug: "pqs-para-quitarse-el-sombrero",
		websiteUrl: "https://pqs.pe/",
	},
	{
		slug: "procapitales",
		websiteUrl: "https://procapitales.org/",
	},
	{
		slug: "prociencia",
		websiteUrl: "https://prociencia.gob.pe/",
	},
	{
		slug: "programa-nacional-tu-empresa",
		websiteUrl: "https://www.gob.pe/tuempresa",
	},
	{
		slug: "proinnovate",
		websiteUrl: "https://www.gob.pe/proinnovate",
	},
	{
		slug: "camara-de-comercio-y-produccion-de-cusco",
		websiteUrl: "https://www.camaracusco.org/",
	},
	{
		slug: "camara-de-comercio-y-produccion-de-piura",
		websiteUrl: "https://camcopiura.org.pe/",
	},
	{
		slug: "endeavor-peru",
		websiteUrl: "https://endeavor.org.pe/",
	},
	{
		slug: "incubagraria",
		websiteUrl: "https://incubagraria.lamolina.edu.pe/",
	},
	{
		slug: "bcp-banco-del-credito-del-peru",
		websiteUrl: "https://www.viabcp.com/",
	},
	{
		slug: "cofide-corporacion-financiera-de-desarrollo",
		websiteUrl: "https://www.cofide.com.pe/",
	},
	{
		slug: "krealo",
		websiteUrl: "https://krealo.pe/",
	},
	{
		slug: "liquid-venture-studio-2",
		websiteUrl: "https://www.liquid.ventures/",
	},
	{
		slug: "nesst",
		websiteUrl: "https://www.nesst.org/peru",
	},
	{
		slug: "inca-ventures",
		websiteUrl: "https://www.incaventures.com/",
	},
	{
		slug: "kukua-ventures",
		websiteUrl: "https://www.kukuaventures.com/",
	},
	{
		slug: "rimac",
		websiteUrl: "https://www.rimac.com/",
	},
	{
		slug: "rpp-ventures",
		websiteUrl: "https://grppventures.pe/",
	},
	{
		slug: "salkantay-ventures",
		websiteUrl: "https://www.salkantay.vc/",
	},
	{
		slug: "comunal-coworking",
		websiteUrl: "https://comunal.co/",
	},
	{
		slug: "wework",
		websiteUrl: "https://www.wework.com/",
	},
	{
		slug: "rebaza-alcazar-de-las-casas",
		websiteUrl: "https://rebaza-alcazar.com/",
	},
	{
		slug: "rodrigo-elias-medrano-abogados",
		websiteUrl: "https://www.estudiorodrigo.com/",
	},
	{
		slug: "vodanovic-legal",
		websiteUrl: "https://vodanovic.pe/",
	},
];

function faviconUrl(websiteUrl: string) {
	const { hostname } = new URL(websiteUrl);
	return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
}

async function applyWebsiteSeed(
	seed: EcosystemWebsiteSeed,
	{ dryRun, force }: { dryRun: boolean; force: boolean },
) {
	const existing = await db.query.organizations.findFirst({
		where: eq(organizations.slug, seed.slug),
	});

	if (!existing) {
		return { slug: seed.slug, action: "missing_org" };
	}

	const hasWebsite = Boolean(existing.websiteUrl?.trim());
	if (hasWebsite && !force) {
		return { slug: seed.slug, action: "skipped_has_website" };
	}

	const values = {
		websiteUrl: seed.websiteUrl,
		logoUrl: existing.logoUrl?.trim() || faviconUrl(seed.websiteUrl),
		updatedAt: new Date(),
	};

	if (dryRun) {
		return {
			slug: seed.slug,
			action: hasWebsite ? "would_force_update" : "would_update",
		};
	}

	await db
		.update(organizations)
		.set(values)
		.where(eq(organizations.id, existing.id));

	return {
		slug: seed.slug,
		action: hasWebsite ? "force_updated" : "updated",
	};
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const force = process.argv.includes("--force");
	const results = [];

	for (const seed of ecosystemWebsites) {
		results.push(await applyWebsiteSeed(seed, { dryRun, force }));
	}

	console.log(
		JSON.stringify(
			{
				dryRun,
				force,
				total: results.length,
				updated: results.filter((result) => result.action === "updated").length,
				forceUpdated: results.filter(
					(result) => result.action === "force_updated",
				).length,
				wouldUpdate: results.filter(
					(result) => result.action === "would_update",
				).length,
				wouldForceUpdate: results.filter(
					(result) => result.action === "would_force_update",
				).length,
				skippedHasWebsite: results.filter(
					(result) => result.action === "skipped_has_website",
				).length,
				missingOrg: results.filter((result) => result.action === "missing_org")
					.length,
				results,
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
