import { tasks } from "@trigger.dev/sdk/v3";
import type { LumaWebhookTaskPayload } from "@/lib/luma/types";
import type { lumaWebhookProcessorTask } from "@/trigger/luma-webhook-processor";

const FAILED_EVENTS: LumaWebhookTaskPayload[] = [
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-kIobZusrFDjsufQ",
			api_id: "evt-kIobZusrFDjsufQ",
			url: "https://luma.com/lg5k4pfv",
			name: "ABC del Ecosistema de Innovación",
			start_at: "2026-02-25T00:00:00.000Z",
			end_at: "2026-02-25T01:00:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/2a/b600d73f-586e-4212-aebf-b2eb1b996ee4.png",
			platform: "luma",
			meeting_url: "https://meet.google.com/mdm-sjjf-hfh",
			hosts: [
				{
					id: "usr-RTYty0QxYqy2gNH",
					name: "Mayckol Cruzado Ordoñez",
					avatar_url:
						"https://images.lumacdn.com/avatars/2a/2d19fb3e-935e-4375-8801-526330946e70.jpg",
				},
				{
					id: "usr-jL8JsjcJZyZEELJ",
					name: "Javo",
					avatar_url:
						"https://images.lumacdn.com/avatars/h2/4787a38c-784e-4dea-b8db-df3f74e6b7c1.jpg",
				},
				{
					id: "usr-WCvZP6ABC54eywD",
					name: "Ignacio Velasquez",
					avatar_url:
						"https://images.lumacdn.com/avatars/82/4cb29655-c925-4fcf-9f65-f4972b98b8e3.jpg",
				},
				{
					id: "usr-RPsAuizsYwAl8W0",
					name: "Daniel Chavez",
					avatar_url:
						"https://images.lumacdn.com/avatars/66/b9f491cb-a91c-4f9d-8d31-2042c784aeb0.jpg",
				},
			],
			calendar: {
				id: "cal-SWU8CT273B56jaH",
				url: "https://luma.com/ai-first-founders",
				name: "AI First Founders",
				slug: "ai-first-founders",
				website: "https://bit.ly/comunidad-skool",
				avatar_url:
					"https://images.lumacdn.com/calendars/t0/3bec6b74-fd1a-4d65-b4b7-c5bf89550b12.png",
				description:
					"Automatiza, crea y colabora: workshops, vibe coding y hackathons.",
				is_personal: false,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.unsplash.com/photo-1668450433152-e56d7e8fe4ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjQyMjF8MHwxfHNlYXJjaHw2fHxhYnN0cmFjdCUyMDNkfGVufDB8fHx8MTc2Mjk3NTczMHwy&ixlib=rb-4.1.0&q=80&w=1080",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-N7ZDP9fQHLzOkeT",
			api_id: "evt-N7ZDP9fQHLzOkeT",
			url: "https://luma.com/wth0aq1k",
			name: "¿Cómo hacer pitch a un inversionistas?",
			start_at: "2026-03-11T00:00:00.000Z",
			end_at: "2026-03-11T01:00:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/ne/a7a03f17-4b81-4bb6-b7e6-86ee534c5af4.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-RTYty0QxYqy2gNH",
					name: "Mayckol Cruzado Ordoñez",
					avatar_url:
						"https://images.lumacdn.com/avatars/2a/2d19fb3e-935e-4375-8801-526330946e70.jpg",
				},
				{
					id: "usr-jL8JsjcJZyZEELJ",
					name: "Javo",
					avatar_url:
						"https://images.lumacdn.com/avatars/h2/4787a38c-784e-4dea-b8db-df3f74e6b7c1.jpg",
				},
				{
					id: "usr-WCvZP6ABC54eywD",
					name: "Ignacio Velasquez",
					avatar_url:
						"https://images.lumacdn.com/avatars/82/4cb29655-c925-4fcf-9f65-f4972b98b8e3.jpg",
				},
			],
			calendar: {
				id: "cal-SWU8CT273B56jaH",
				url: "https://luma.com/ai-first-founders",
				name: "AI First Founders",
				slug: "ai-first-founders",
				website: "https://bit.ly/comunidad-skool",
				avatar_url:
					"https://images.lumacdn.com/calendars/t0/3bec6b74-fd1a-4d65-b4b7-c5bf89550b12.png",
				description:
					"Automatiza, crea y colabora: workshops, vibe coding y hackathons.",
				is_personal: false,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.unsplash.com/photo-1668450433152-e56d7e8fe4ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjQyMjF8MHwxfHNlYXJjaHw2fHxhYnN0cmFjdCUyMDNkfGVufDB8fHx8MTc2Mjk3NTczMHwy&ixlib=rb-4.1.0&q=80&w=1080",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-ifvZToGCUQ1yMmw",
			api_id: "evt-ifvZToGCUQ1yMmw",
			url: "https://luma.com/3avs7wgb",
			name: "Vibe Coding con Antigravity",
			start_at: "2026-03-18T00:00:00.000Z",
			end_at: "2026-03-18T01:00:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/d4/467ef5e9-38d4-4714-b3b9-0181ebfdbd95.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-RTYty0QxYqy2gNH",
					name: "Mayckol Cruzado Ordoñez",
					avatar_url:
						"https://images.lumacdn.com/avatars/2a/2d19fb3e-935e-4375-8801-526330946e70.jpg",
				},
				{
					id: "usr-jL8JsjcJZyZEELJ",
					name: "Javo",
					avatar_url:
						"https://images.lumacdn.com/avatars/h2/4787a38c-784e-4dea-b8db-df3f74e6b7c1.jpg",
				},
				{
					id: "usr-WCvZP6ABC54eywD",
					name: "Ignacio Velasquez",
					avatar_url:
						"https://images.lumacdn.com/avatars/82/4cb29655-c925-4fcf-9f65-f4972b98b8e3.jpg",
				},
			],
			calendar: {
				id: "cal-SWU8CT273B56jaH",
				url: "https://luma.com/ai-first-founders",
				name: "AI First Founders",
				slug: "ai-first-founders",
				website: "https://bit.ly/comunidad-skool",
				avatar_url:
					"https://images.lumacdn.com/calendars/t0/3bec6b74-fd1a-4d65-b4b7-c5bf89550b12.png",
				description:
					"Automatiza, crea y colabora: workshops, vibe coding y hackathons.",
				is_personal: false,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.unsplash.com/photo-1668450433152-e56d7e8fe4ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjQyMjF8MHwxfHNlYXJjaHw2fHxhYnN0cmFjdCUyMDNkfGVufDB8fHx8MTc2Mjk3NTczMHwy&ixlib=rb-4.1.0&q=80&w=1080",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-buqxbrjJ9TzHKeU",
			api_id: "evt-buqxbrjJ9TzHKeU",
			url: "https://luma.com/7szf6n8s",
			name: "Chatbot de WhatsApp con n8n y Kapso",
			start_at: "2026-03-04T00:00:00.000Z",
			end_at: "2026-03-04T01:00:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/38/fcf66c77-0752-44bd-8f84-407f799af9aa.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-RTYty0QxYqy2gNH",
					name: "Mayckol Cruzado Ordoñez",
					avatar_url:
						"https://images.lumacdn.com/avatars/2a/2d19fb3e-935e-4375-8801-526330946e70.jpg",
				},
				{
					id: "usr-jL8JsjcJZyZEELJ",
					name: "Javo",
					avatar_url:
						"https://images.lumacdn.com/avatars/h2/4787a38c-784e-4dea-b8db-df3f74e6b7c1.jpg",
				},
				{
					id: "usr-WCvZP6ABC54eywD",
					name: "Ignacio Velasquez",
					avatar_url:
						"https://images.lumacdn.com/avatars/82/4cb29655-c925-4fcf-9f65-f4972b98b8e3.jpg",
				},
				{
					id: "usr-Xiv19Dm8N4cCBgL",
					name: "Stiven Rosales",
					avatar_url:
						"https://images.lumacdn.com/avatars/jn/6a58c64f-dc37-45f0-91e0-bd15ea177fde.jpg",
				},
			],
			calendar: {
				id: "cal-SWU8CT273B56jaH",
				url: "https://luma.com/ai-first-founders",
				name: "AI First Founders",
				slug: "ai-first-founders",
				website: "https://bit.ly/comunidad-skool",
				avatar_url:
					"https://images.lumacdn.com/calendars/t0/3bec6b74-fd1a-4d65-b4b7-c5bf89550b12.png",
				description:
					"Automatiza, crea y colabora: workshops, vibe coding y hackathons.",
				is_personal: false,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.unsplash.com/photo-1668450433152-e56d7e8fe4ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjQyMjF8MHwxfHNlYXJjaHw2fHxhYnN0cmFjdCUyMDNkfGVufDB8fHx8MTc2Mjk3NTczMHwy&ixlib=rb-4.1.0&q=80&w=1080",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-jzUqQTNIAMAPPKJ",
			api_id: "evt-jzUqQTNIAMAPPKJ",
			url: "https://luma.com/935r7zp6",
			name: "Cursor Hackathon Guatemala",
			start_at: "2026-03-07T16:00:00.000Z",
			end_at: "2026-03-07T23:00:00.000Z",
			timezone: "America/Guatemala",
			cover_url:
				"https://images.lumacdn.com/event-covers/ws/2fdda550-07bc-40e7-8c1b-dcf89447ec96.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-j3NvOcfBQFPlAg9",
					name: "Oscar Morales",
					avatar_url:
						"https://images.lumacdn.com/avatars/6p/4a1c99aa-392e-42a0-bed8-374d612da945.jpg",
				},
				{
					id: "usr-Ng1cN0AGIKPYYte",
					name: "Walter Morales",
					avatar_url:
						"https://images.lumacdn.com/avatars/62/8aa48d00-3d1b-4efd-b1ea-888daac290bc.png",
				},
				{
					id: "usr-lCO6H47F6QhDXeF",
					name: "the502project",
					avatar_url:
						"https://images.lumacdn.com/avatars/5o/896528ee-3a8c-4bc0-96a0-cb1f952d5932.png",
				},
				{
					id: "usr-GJxkeHa5DjsPCYC",
					name: "Vudy App",
					avatar_url:
						"https://images.lumacdn.com/avatars/2v/dfd252f5-9795-43ab-910d-21a55bc6551f.png",
				},
			],
			calendar: {
				id: "cal-61Cv6COs4g9GKw7",
				url: "https://luma.com/cursorcommunity",
				name: "Cursor Community",
				slug: "cursorcommunity",
				website: "https://cursor.com",
				avatar_url:
					"https://images.lumacdn.com/calendars/p2/d5092a23-d1bd-482f-a724-8f97392ce626.png",
				description:
					"Cursor community meetups, hackathons, workshops taking place around the world.",
				is_personal: false,
				twitter_handle: "cursor_ai",
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-cover-images/j7/f5e2cdc4-fc9b-4f54-a724-7ad8323b2c57.jpg",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-0MTiVyKCdhcXSqS",
			api_id: "evt-0MTiVyKCdhcXSqS",
			url: "https://luma.com/z2gasmoh",
			name: "Arequipa NEXT",
			start_at: "2026-02-21T16:00:00.000Z",
			end_at: "2026-02-21T21:00:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/hc/f35a8738-bde1-41c8-a4de-a26fccf208e3.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-1C7NM5n8B8xO4nA",
					name: "Juan Pablo Sinarahua | Laboral.AI",
					avatar_url:
						"https://images.lumacdn.com/avatars/8t/6f26da81-9d76-4e1b-926d-1a3fbc80e19d.jpg",
				},
				{
					id: "usr-xhsoHkZ4AidQf1F",
					name: "Sdenka Lazo",
					avatar_url: "https://cdn.lu.ma/avatars-default/avatar_45.png",
				},
				{
					id: "usr-sOTIhscvwX7uIXr",
					name: "Alfredo Gama",
					avatar_url:
						"https://images.lumacdn.com/avatars/ay/7c1631f2-00ff-48bf-9c47-ae125badbf70.jpg",
				},
			],
			calendar: {
				id: "cal-0HkLCMIc2OjHE0T",
				url: "https://luma.com/laboral",
				name: "Laboral.AI | Empleabilidad, Modernidad & Oportunidades",
				slug: "laboral",
				website: null,
				avatar_url: "https://cdn.lu.ma/avatars-default/community_avatar_3.png",
				description:
					"Eventos relacionados a potenciar la empleabilidad, aprovechar oportunidades y desarrollar las habilidades necesarias para el presente y futuro mundo laboral",
				is_personal: false,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-defaults/patterns/diamonds-100.png",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-btCoaakf6hFKDN8",
			api_id: "evt-btCoaakf6hFKDN8",
			url: "https://luma.com/bs9baz59",
			name: "Human Sessions - Baby Steps in Webflow",
			start_at: "2026-02-28T19:30:00.000Z",
			end_at: "2026-02-28T22:30:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/0s/3cdecf81-ad8e-400d-adc0-262ed35cd63a.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-l9ai6uzNL5CwGaU",
					name: "Fiorella Cisneros",
					avatar_url:
						"https://images.lumacdn.com/avatars/ae/4d43c586-42e6-430f-a937-372b38b702af.jpg",
				},
				{
					id: "usr-mIM0eMJbFJE2aeC",
					name: "Danitza Vilchez Rosas",
					avatar_url:
						"https://images.lumacdn.com/avatars/3v/405b079a-06e2-4f0e-b2f6-1abacdf34ed2",
				},
				{
					id: "usr-SFCrDcAnLaiIrgA",
					name: "forHuman",
					avatar_url:
						"https://images.lumacdn.com/avatars/ap/1b982ae3-e6e7-4bea-afcf-bbdf19b6b166.png",
				},
			],
			calendar: {
				id: "cal-eO8FGFB7Hc8PWF2",
				url: "https://luma.com/calendar/cal-eO8FGFB7Hc8PWF2",
				name: "Personal",
				slug: null,
				website: null,
				avatar_url: "https://cdn.lu.ma/avatars-default/community_avatar_14.png",
				description: null,
				is_personal: true,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-defaults/patterns/rain-100.png",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-IIMwAtH7UXHsz4j",
			api_id: "evt-IIMwAtH7UXHsz4j",
			url: "https://luma.com/bdxgffqm",
			name: "Jelou Launch Week",
			start_at: "2026-02-27T20:00:00.000Z",
			end_at: "2026-02-27T21:00:00.000Z",
			timezone: "America/Bogota",
			cover_url:
				"https://images.lumacdn.com/event-covers/c2/4bd5a471-22ea-49ae-b776-55a1bc9b15b3.jpg",
			platform: "luma",
			hosts: [
				{
					id: "usr-XH3IrB5HQGZetsM",
					name: "Karen  Saavedra ",
					avatar_url:
						"https://images.lumacdn.com/avatars/te/6cfbe226-184d-4a29-a7f7-b8a255222392.jpg",
				},
				{
					id: "usr-w6N9fx6hmSDrOc6",
					name: "Juan Hurtado",
					avatar_url: "https://cdn.lu.ma/avatars-default/avatar_7.png",
				},
			],
			calendar: {
				id: "cal-eVLVe1xggxy3Zro",
				url: "https://luma.com/calendar/cal-eVLVe1xggxy3Zro",
				name: "Personal",
				slug: null,
				website: null,
				avatar_url: "https://cdn.lu.ma/avatars-default/community_avatar_3.png",
				description: null,
				is_personal: true,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-defaults/patterns/diamonds-100.png",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-1ZB1wn3oygnq4Q1",
			api_id: "evt-1ZB1wn3oygnq4Q1",
			url: "https://luma.com/jt6f0t3a",
			name: "CCMD 2026 - CONFERENCIA ANUAL",
			start_at: "2026-03-14T20:00:00.000Z",
			end_at: "2026-03-15T01:00:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/6q/ee6da61a-0db3-40ba-8cf4-f65153058026.jpg",
			platform: "luma",
			hosts: [
				{
					id: "usr-xqzDqq7oXTBWlTK",
					name: "NURLEAD",
					avatar_url:
						"https://images.lumacdn.com/avatars/c7/557743cc-00c1-465e-9170-e732a7d34e58",
				},
			],
			calendar: {
				id: "cal-LwBlkIkJu2ucfi2",
				url: "https://luma.com/calendar/cal-LwBlkIkJu2ucfi2",
				name: "Personal",
				slug: null,
				website: null,
				avatar_url: "https://cdn.lu.ma/avatars-default/community_avatar_11.png",
				description: null,
				is_personal: true,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-defaults/patterns/diamonds-100.png",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-ipgvcMI8dh4HpOc",
			api_id: "evt-ipgvcMI8dh4HpOc",
			url: "https://luma.com/i2ezhmyk",
			name: "OpenClaw para Marketers",
			start_at: "2026-02-26T00:00:00.000Z",
			end_at: "2026-02-26T01:00:00.000Z",
			timezone: "America/Bogota",
			cover_url:
				"https://images.lumacdn.com/event-covers/kr/a25a4b8a-213e-420f-be1c-93239a31ec22.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-VZzLqkbW2q0pYqv",
					name: "Gabriela García González",
					avatar_url: "https://cdn.lu.ma/avatars-default/avatar_45.png",
				},
				{
					id: "usr-egAvM4JVEaRfnsB",
					name: "Daniela Gomez",
					avatar_url: "https://cdn.lu.ma/avatars-default/avatar_35.png",
				},
			],
			calendar: {
				id: "cal-vwIdWR9STPyGSm0",
				url: "https://luma.com/calendar/cal-vwIdWR9STPyGSm0",
				name: "The Growth System",
				slug: null,
				website: null,
				avatar_url:
					"https://images.lumacdn.com/calendars/53/82be99ca-56e3-4600-9fe2-5abcea6731bb.webp",
				description:
					"La estrategia y las tácticas están desconectadas. En The Growth System queremos conectar ambas cosas.",
				is_personal: false,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-defaults/patterns/metaballs-100.png",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-aAvBtv3pzd060Ql",
			api_id: "evt-aAvBtv3pzd060Ql",
			url: "https://luma.com/fy1bz5v6",
			name: "Presentación de Proyectos Acelerados por ADN Partners | Generación Impacto",
			start_at: "2026-02-26T22:00:00.000Z",
			end_at: "2026-02-27T00:00:00.000Z",
			timezone: "America/Lima",
			cover_url:
				"https://images.lumacdn.com/event-covers/cv/294866ae-63ba-4f01-8bd7-f6aeec5808e8.jpg",
			platform: "luma",
			hosts: [
				{
					id: "usr-7sqCoNEoUgLbKW6",
					name: "Clarissa Ghiordany Palomino Portugal",
					avatar_url: "https://cdn.lu.ma/avatars-default/avatar_29.png",
				},
				{
					id: "usr-8InJHKaqtNi4oJy",
					name: "Alfredo Gama Zapata",
					avatar_url: "https://cdn.lu.ma/avatars-default/avatar_16.png",
				},
				{
					id: "usr-sOTIhscvwX7uIXr",
					name: "Alfredo Gama",
					avatar_url:
						"https://images.lumacdn.com/avatars/ay/7c1631f2-00ff-48bf-9c47-ae125badbf70.jpg",
				},
			],
			calendar: {
				id: "cal-aanWN5kK7gHCDcx",
				url: "https://luma.com/calendar/cal-aanWN5kK7gHCDcx",
				name: "Personal",
				slug: null,
				website: null,
				avatar_url: "https://cdn.lu.ma/avatars-default/community_avatar_16.png",
				description: null,
				is_personal: true,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-defaults/patterns/stairs-100.png",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "evt-bkTqowHb96MGdcH",
			api_id: "evt-bkTqowHb96MGdcH",
			url: "https://luma.com/63xdcail",
			name: "Code Brew Pereira",
			start_at: "2026-03-05T23:30:00.000Z",
			end_at: "2026-03-06T02:00:00.000Z",
			timezone: "America/Bogota",
			cover_url:
				"https://images.lumacdn.com/event-covers/9i/f46864c4-95ff-4250-9e8a-7ee38e687eba.png",
			platform: "luma",
			hosts: [
				{
					id: "usr-IHpNu3nhlu8X0Jz",
					name: "Anthony Cueva",
					avatar_url:
						"https://images.lumacdn.com/avatars/8f/30a44687-76ff-42d9-85c2-8ccd0ce9ed52.jpg",
				},
				{
					id: "usr-uoADxXvmcdZ64QE",
					name: "Alejandra Morales Garzón",
					avatar_url:
						"https://images.lumacdn.com/avatars/mo/440d1c14-e99b-4841-8d0f-d646a8dd5864.jpg",
				},
				{
					id: "usr-pHaBTs0WYFqiTh5",
					name: "Cris",
					avatar_url:
						"https://images.lumacdn.com/avatars/s6/1b47985f-45a5-4a5c-853a-9c0c5a67def5.png",
				},
				{
					id: "usr-O99BIbpG8rFPP2M",
					name: "Melissa Escobar G",
					avatar_url:
						"https://images.lumacdn.com/avatars/hy/699b001c-ced5-4e3a-9438-561585c2187e.jpg",
				},
			],
			calendar: {
				id: "cal-nX55hyTpWNJEKTH",
				url: "https://luma.com/calendar/cal-nX55hyTpWNJEKTH",
				name: "Personal",
				slug: null,
				website: null,
				avatar_url: "https://cdn.lu.ma/avatars-default/community_avatar_4.png",
				description: null,
				is_personal: true,
				twitter_handle: null,
				youtube_handle: null,
				cover_image_url:
					"https://images.lumacdn.com/calendar-defaults/patterns/waves-100.png",
				instagram_handle: null,
				social_image_url: null,
			},
		},
	},
	{
		event_type: "calendar.event.added",
		data: {
			id: "calev-RbXmiMEPAAEpvYV",
			api_id: "calev-RbXmiMEPAAEpvYV",
			url: "https://santiago.aitinkerers.org/p/openclaw-anti-hackathon-santiago-de-chile",
			name: "OpenClaw / ANTI-Hackathon: Santiago de Chile",
			start_at: "2026-02-28T16:00:00.000Z",
			end_at: "2026-02-28T21:00:00.000+00:00",
			timezone: "America/Santiago",
			cover_url: null,
			platform: "external",
		},
	},
];

async function main() {
	console.log(`Backfilling ${FAILED_EVENTS.length} failed Luma events...\n`);

	const seen = new Set<string>();
	const unique = FAILED_EVENTS.filter((e) => {
		if (seen.has(e.data.api_id)) return false;
		seen.add(e.data.api_id);
		return true;
	});

	console.log(`${unique.length} unique events after dedup\n`);

	for (const payload of unique) {
		console.log(`Triggering: ${payload.data.name}`);
		console.log(`  Calendar: ${payload.data.calendar?.name || "unknown"}`);
		console.log(`  Slug: ${payload.data.calendar?.slug || "null"}`);

		const handle = await tasks.trigger<typeof lumaWebhookProcessorTask>(
			"luma-webhook-processor",
			payload,
		);
		console.log(`  Run ID: ${handle.id}\n`);
	}

	console.log("Done! All events triggered for backfill.");
}

main().catch(console.error);
