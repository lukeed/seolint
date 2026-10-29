/** The two-letter language codes of ISO 639-1, such as `en`. */
export const languages: ReadonlySet<string> = new Set(
	[
		"aa ab ae af ak am an ar as av ay az ba be bg bi bm bn bo br bs ca ce ch",
		"co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy",
		"ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it",
		"iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo",
		"lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny",
		"oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl",
		"sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty",
		"ug uk ur uz ve vi vo wa wo xh yi yo za zh zu",
	]
		.join(" ")
		.split(" "),
);

/** The two-letter region codes of ISO 3166-1, such as `GB`. Reserved codes, such as `UK` and `EU`, are not in it. */
export const regions: ReadonlySet<string> = new Set(
	[
		"AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM",
		"BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO",
		"KM CG CD CK CR HR CU CW CY CZ CI DK DJ DM DO EC EG SV GQ ER EE SZ ET FK",
		"FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT",
		"HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW",
		"KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM",
		"MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK",
		"PW PS PA PG PY PE PH PN PL PT PR QA RO RU RW RE BL SH KN LC MF PM VC WS",
		"SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY",
		"TW TJ TZ TH TL TG TK TO TT TN TM TC TV TR UG UA AE GB US UM UY UZ VU VE",
		"VN VG VI WF EH YE ZM ZW AX",
	]
		.join(" ")
		.split(" "),
);

/** The four-letter script codes of ISO 15924, such as `Hant`. */
export const scripts: ReadonlySet<string> = new Set(
	[
		"Adlm Afak Aghb Ahom Arab Aran Armi Armn Avst Bali Bamu Bass Batk Beng",
		"Berf Bhks Blis Bopo Brah Brai Bugi Buhd Cakm Cans Cari Cham Cher Chis",
		"Chrs Cirt Copt Cpmn Cprt Cyrl Cyrs Deva Diak Dogr Dsrt Dupl Egyd Egyh",
		"Egyp Elba Elym Ethi Gara Geok Geor Glag Gong Gonm Goth Gran Grek Gujr",
		"Gukh Guru Hanb Hang Hani Hano Hans Hant Hatr Hebr Hira Hluw Hmng Hmnp",
		"Hntl Hrkt Hung Inds Ital Jamo Java Jpan Jurc Kali Kana Kawi Khar Khmr",
		"Khoj Kitl Kits Knda Kore Kpel Krai Kthi Lana Laoo Latf Latg Latn Leke",
		"Lepc Limb Lina Linb Lisu Loma Lyci Lydi Mahj Maka Mand Mani Marc Maya",
		"Medf Mend Merc Mero Mlym Modi Mong Moon Mroo Mtei Mult Mymr Nagm Nand",
		"Narb Nbat Newa Nkdb Nkgb Nkoo Nshu Ogam Olck Onao Orkh Orya Osge Osma",
		"Ougr Palm Pauc Pcun Pelm Perm Phag Phli Phlp Phlv Phnx Plrd Piqd Prti",
		"Psin Qaaa Qabx Ranj Rjng Rohg Roro Runr Samr Sara Sarb Saur Seal Sgnw",
		"Shaw Shrd Shui Sidd Sidt Sind Sinh Sogd Sogo Sora Soyo Sund Sunu Sylo",
		"Syrc Syre Syrj Syrn Tagb Takr Tale Talu Taml Tang Tavt Tayo Telu Teng",
		"Tfng Tglg Thaa Thai Tibt Tirh Tnsa Todr Tols Toto Tutg Ugar Vaii Visp",
		"Vith Wara Wcho Wole Xpeo Xsux Yezi Yiii Zanb Zinh Zmth Zsye Zsym Zxxx",
		"Zyyy Zzzz",
	]
		.join(" ")
		.split(" "),
);
