# Changelog

## M3.2.0 – Verordnung (EU) 2023/1230
- Rechtsgrundlage auf Verordnung (EU) 2023/1230 umgestellt.
- Verweise auf Anhang III ergänzt.
- Projektdaten um bestimmungsgemäße Verwendung, vorhersehbare Fehlanwendung und Maschinengrenzen erweitert.
- Neue Gefährdungen zu Schutz gegen Korrumpierung, sicherheitsrelevanter Software, Manipulation, adaptiven/KI-Funktionen und Gesamtheiten von Maschinen.
- Dokumentexport auf die neue Rechtsgrundlage umgestellt.
- Bestehende Risikobeurteilung nach EN ISO 12100 bleibt als Methodik erhalten.


## M3.2.1 – Sicherung der Gruppenabwahl und Bericht
- Gefährdungsgruppen lassen sich nur mit dokumentierter Begründung deaktivieren.
- Begründungen werden projektbezogen gespeichert und in den Word-Bericht übernommen.
- Exportprüfung blockiert unbegründete Gruppenausschlüsse.
- Hinweis: Gefährdungskatalog ist keine vollständige Anhang-III-Konformitätsmatrix.


## M3.2.2 – Kein automatisches Ausblenden durch Komponentenfragen
- Antworten auf Komponentenfragen führen nicht mehr zum stillen Ausblenden von Gefährdungen.
- Manuelle Gruppenausschlüsse bleiben mit Begründung möglich.
- Risikoansicht und Export verwenden dieselbe Filterregel.


## M3.2.3 – Navigation stabilisiert
- Navigation bindet Klicks nur einmal; Hauptnavigation ersetzt Notfall-Handler nach Modulstart.
- Irreführende 5-Sekunden-Startwarnung entfernt.
- Versionsanzeige und Beschreibung der Komponentenlogik aktualisiert.


## M3.2.4 – Weiter-Schaltfläche für mobile Projekterfassung
- Am Ende der Projektdaten: „Weiter zur Risikoanalyse“.
- Vor dem Wechsel wird die vorhandene Speicherfunktion aufgerufen.
- Funktioniert über die bestehende Navigation auch als Fallback.


## M3.3 – Fachliche Katalogprüfung (begonnen)
- Bestand und offene Abgleichpunkte in `docs/M3.3-katalogpruefung.md` dokumentiert.
- Keine ungeprüfte Behauptung einer vollständigen Anhang-III-Abdeckung.


## M3.3.0 – Pilot-Prüfmatrix Anhang III
- Separater Menüpunkt mit sieben vorläufigen Prüfpunkten.
- Projektbezogener Status und Begründung/Nachweis werden lokal gespeichert.
- Ausdrücklich keine vollständige oder amtlich verifizierte Anhang-III-Matrix; Exportfreigabe unverändert.


## M3.3.1 – Mobiles Menü bei Anhang III schließen
- Fehlenden Navigationstitel für neuen Menüpunkt Anhang III ergänzt.
- Robuste Fallback-Titelbehandlung verhindert Abbruch vor dem Schließen der Seitenleiste.
