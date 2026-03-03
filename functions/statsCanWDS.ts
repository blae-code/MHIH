import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const WDS_REST = "https://www150.statcan.gc.ca/t1/wds/rest";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── Search cubes (filter getAllCubesListLite by keyword) ────────────────
    if (action === "search") {
      const { query = "" } = body;

      const res = await fetch(`${WDS_REST}/getAllCubesListLite`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error(`WDS getAllCubesListLite failed: ${res.status}`);
      const all = await res.json();

      const q = query.toLowerCase().trim();
      const filtered = (all || []).filter(cube => {
        if (!q) return true;
        const title = (cube.cubeTitleEn || "").toLowerCase();
        const subject = (cube.subjectEn || "").toLowerCase();
        return title.includes(q) || subject.includes(q);
      }).slice(0, 30).map(cube => ({
        pid: cube.productId,
        title: cube.cubeTitleEn,
        subject: cube.subjectEn,
        frequency: cube.frequencyCode,
        start_period: cube.cubeStartDate,
        end_period: cube.cubeEndDate,
        url: `https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=${cube.productId}`,
      }));

      return Response.json({ success: true, count: filtered.length, cubes: filtered });
    }

    // ── Get cube metadata ───────────────────────────────────────────────────
    if (action === "metadata") {
      const { pid } = body;
      if (!pid) return Response.json({ error: "pid required" }, { status: 400 });

      const res = await fetch(
        `${WDS_REST}/getCubeMetadata/${pid}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`WDS getCubeMetadata failed: ${res.status}`);
      const data = await res.json();
      const obj = Array.isArray(data) ? data[0] : data;

      return Response.json({
        success: true,
        metadata: {
          pid: obj.productId,
          title: obj.cubeTitleEn,
          frequency: obj.frequencyCode,
          start_period: obj.cubeStartDate,
          end_period: obj.cubeEndDate,
          subject: obj.subjectEn,
          survey: obj.surveyEn,
          dimensions: (obj.dimension || []).map(d => ({
            id: d.dimensionPositionId,
            name: d.dimensionNameEn,
            members: (d.member || []).slice(0, 20).map(m => ({
              id: m.memberId,
              name: m.memberNameEn,
            })),
          })),
          url: `https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=${obj.productId}`,
        },
      });
    }

    // ── Get latest N periods from a vector ──────────────────────────────────
    if (action === "vector_data") {
      const { vectors, n_periods = 10 } = body;
      if (!vectors?.length) return Response.json({ error: "vectors array required" }, { status: 400 });

      const payload = vectors.map(v => ({ vectorId: v, latestN: n_periods }));
      const res = await fetch(
        `${WDS_REST}/getDataFromVectorsAndLatestNPeriods`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`WDS getDataFromVectorsAndLatestNPeriods failed: ${res.status}`);
      const data = await res.json();

      const series = (Array.isArray(data) ? data : [data]).map(s => ({
        vector_id: s.vectorId,
        coordinate: s.coordinate,
        title: s.SeriesTitleEn || s.seriesTitleEn,
        unit: s.memberUomCode,
        scalar: s.scalarFactorCode,
        points: (s.vectorDataPoint || []).map(p => ({
          period: p.refPer,
          value: p.value,
          status: p.statusCode,
        })),
      }));

      return Response.json({ success: true, series });
    }

    // ── Get data from cube PID + coord (latest N periods) ───────────────────
    if (action === "cube_data") {
      const { pid, coordinate, n_periods = 10 } = body;
      if (!pid || !coordinate) return Response.json({ error: "pid and coordinate required" }, { status: 400 });

      const res = await fetch(
        `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/getDataFromCubePidCoordAndLatestNPeriods/${pid}/${coordinate}/${n_periods}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`WDS getDataFromCubePidCoordAndLatestNPeriods failed: ${res.status}`);
      const data = await res.json();
      const obj = Array.isArray(data) ? data[0] : data;

      return Response.json({
        success: true,
        series: {
          vector_id: obj?.object?.vectorId,
          coordinate: obj?.object?.coordinate,
          title: obj?.object?.SeriesTitleEn || obj?.object?.seriesTitleEn,
          points: (obj?.object?.vectorDataPoint || []).map(p => ({
            period: p.refPer,
            value: p.value,
            status: p.statusCode,
          })),
        },
      });
    }

    return Response.json({ error: "Unknown action. Use: search | metadata | vector_data | cube_data" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});