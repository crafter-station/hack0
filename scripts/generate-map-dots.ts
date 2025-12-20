import * as d3 from "d3";
import { feature } from "topojson-client";
import { writeFileSync } from "fs";
import { join } from "path";
import worldData from "../public/countries-110m.json";
import peruDeptData from "../public/peru_departamental_simple.json";

const LATAM_COUNTRY_IDS = [
	"032", "068", "076", "152", "170", "188", "192", "214",
	"218", "222", "320", "340", "484", "558", "591", "600",
	"604", "858", "862",
];

const PERU_DEPARTMENT_NAME_MAP: Record<string, string> = {
	AMAZONAS: "Amazonas",
	ANCASH: "Áncash",
	APURIMAC: "Apurímac",
	AREQUIPA: "Arequipa",
	AYACUCHO: "Ayacucho",
	CAJAMARCA: "Cajamarca",
	CALLAO: "Callao",
	CUSCO: "Cusco",
	HUANCAVELICA: "Huancavelica",
	HUANUCO: "Huánuco",
	ICA: "Ica",
	JUNIN: "Junín",
	LA_LIBERTAD: "La Libertad",
	LAMBAYEQUE: "Lambayeque",
	LIMA: "Lima",
	LORETO: "Loreto",
	MADRE_DE_DIOS: "Madre de Dios",
	MOQUEGUA: "Moquegua",
	PASCO: "Pasco",
	PIURA: "Piura",
	PUNO: "Puno",
	SAN_MARTIN: "San Martín",
	TACNA: "Tacna",
	TUMBES: "Tumbes",
	UCAYALI: "Ucayali",
};

interface GeoFeature {
	type: string;
	id?: string;
	geometry: any;
	properties: any;
}

const WIDTH = 1000;
const HEIGHT = 1100;

const latamProjection = d3
	.geoEquirectangular()
	.scale(750)
	.center([-70, -15])
	.translate([WIDTH / 2, HEIGHT / 2]);

const peruProjection = d3
	.geoEquirectangular()
	.scale(3145)
	.center([-75, -9])
	.translate([WIDTH / 2, HEIGHT / 2]);

function generateLatamDots(
	geoFeatures: GeoFeature[],
	dotSpacing = 0.8,
	borderInset = 0.6,
) {
	const result: Array<{
		countryId: string;
		dots: Array<{ x: number; y: number }>;
	}> = [];

	const minLon = -120;
	const maxLon = -30;
	const minLat = -56;
	const maxLat = 33;

	for (const geoFeature of geoFeatures) {
		const countryId = geoFeature.id || "";
		const dots: Array<{ x: number; y: number }> = [];

		for (let lon = minLon; lon <= maxLon; lon += dotSpacing) {
			for (let lat = minLat; lat <= maxLat; lat += dotSpacing) {
				if (d3.geoContains(geoFeature as any, [lon, lat])) {
					const isNearEdge =
						!d3.geoContains(geoFeature as any, [lon + borderInset, lat]) ||
						!d3.geoContains(geoFeature as any, [lon - borderInset, lat]) ||
						!d3.geoContains(geoFeature as any, [lon, lat + borderInset]) ||
						!d3.geoContains(geoFeature as any, [lon, lat - borderInset]);

					if (!isNearEdge) {
						const coords = latamProjection([lon, lat]);
						if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
							dots.push({
								x: Math.round(coords[0] * 100) / 100,
								y: Math.round(coords[1] * 100) / 100,
							});
						}
					}
				}
			}
		}

		if (dots.length > 0) {
			result.push({ countryId, dots });
		}
	}

	return result;
}

function generatePeruDots(
	peruFeatures: GeoFeature[],
	dotSpacing = 0.18,
	borderInset = 0.08,
) {
	const dots: Array<{ x: number; y: number; dept: string }> = [];
	const minLon = -82;
	const maxLon = -68;
	const minLat = -19;
	const maxLat = 1;

	for (let lon = minLon; lon <= maxLon; lon += dotSpacing) {
		for (let lat = minLat; lat <= maxLat; lat += dotSpacing) {
			for (const deptFeature of peruFeatures) {
				if (d3.geoContains(deptFeature as any, [lon, lat])) {
					let isNearBorder = false;
					for (const otherDept of peruFeatures) {
						if (otherDept.properties?.NOMBDEP === deptFeature.properties?.NOMBDEP) continue;
						if (
							d3.geoContains(otherDept as any, [lon + borderInset, lat]) ||
							d3.geoContains(otherDept as any, [lon - borderInset, lat]) ||
							d3.geoContains(otherDept as any, [lon, lat + borderInset]) ||
							d3.geoContains(otherDept as any, [lon, lat - borderInset])
						) {
							isNearBorder = true;
							break;
						}
					}

					if (!isNearBorder) {
						const coords = peruProjection([lon, lat]);
						if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
							const deptName = deptFeature.properties?.NOMBDEP || "";
							dots.push({
								x: Math.round(coords[0] * 100) / 100,
								y: Math.round(coords[1] * 100) / 100,
								dept: PERU_DEPARTMENT_NAME_MAP[deptName] || deptName,
							});
						}
					}
					break;
				}
			}
		}
	}

	return dots;
}

console.log("Generating LATAM dots...");
const countries = feature(
	worldData as any,
	(worldData as any).objects.countries,
).features;
const latamCountries = countries.filter((c: any) =>
	LATAM_COUNTRY_IDS.includes(c.id),
) as GeoFeature[];

const latamDots = generateLatamDots(latamCountries);
console.log(`Generated ${latamDots.reduce((acc, c) => acc + c.dots.length, 0)} LATAM dots`);

console.log("Generating Peru dots...");
const peruDepartments = feature(
	peruDeptData as any,
	(peruDeptData as any).objects.peru_departamental_simple,
).features as GeoFeature[];

const peruDots = generatePeruDots(peruDepartments);
console.log(`Generated ${peruDots.length} Peru dots`);

const outputPath = join(process.cwd(), "public");

writeFileSync(
	join(outputPath, "latam-dots.json"),
	JSON.stringify(latamDots),
);
console.log("Saved latam-dots.json");

writeFileSync(
	join(outputPath, "peru-dots.json"),
	JSON.stringify(peruDots),
);
console.log("Saved peru-dots.json");

console.log("Done!");
