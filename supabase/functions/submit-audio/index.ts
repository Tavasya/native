import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // 1) Log incoming headers
    console.log("➡️ [submit-audio] Received headers:", Object.fromEntries(req.headers.entries()))

    // 2) Check Content-Type
    const contentType = (req.headers.get("Content-Type") || "").toLowerCase()
    console.log("➡️ [submit-audio] Content-Type:", contentType)

    let submission_id: string | null = null
    let audio_urls: string[] = []

    // 3) If JSON, parse normally
    if (contentType.includes("application/json")) {
      const bodyText = await req.text()
      console.log("➡️ [submit-audio] Raw JSON body:", bodyText)

      try {
        const parsed = JSON.parse(bodyText)
        submission_id = parsed.submission_id
        audio_urls = Array.isArray(parsed.audio_urls) ? parsed.audio_urls : []
        console.log("➡️ [submit-audio] Parsed JSON payload:", { submission_id, audio_urls })
      } catch (e) {
        console.error("❌ [submit-audio] Failed to parse JSON:", e)
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }

    // 4) Otherwise, if form‑URL‑encoded, parse via URLSearchParams
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formText = await req.text()
      console.log("➡️ [submit-audio] Raw form body:", formText)

      const params = new URLSearchParams(formText)
      submission_id = params.get("submission_id")

      // Try to get the comma‑delimited string under "audio_urls"
      const encodedUrls = params.get("audio_urls")
      console.log("➡️ [submit-audio] Form fields (before parsing):", { submission_id, encodedUrls, audio_urls })

      if (encodedUrls) {
        // Since encodedUrls is a comma‑separated list (not JSON),
        // split on commas to recover each URL.
        audio_urls = encodedUrls.split(",")
        console.log("➡️ [submit-audio] Split audio_urls by commas:", audio_urls)
      }
    } else {
      console.warn("⚠️ [submit-audio] Unrecognized Content-Type; raw body below:")
      const bodyText = await req.text()
      console.log("➡️ [submit-audio] Raw body (unknown format):", bodyText)
      return new Response(
        JSON.stringify({ error: "Unsupported Content-Type" }),
        { status: 415, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!submission_id) {
      console.error("❌ [submit-audio] Missing submission_id after parsing")
      return new Response(
        JSON.stringify({ error: "submission_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (audio_urls.length === 0) {
      console.warn("⚠️ [submit-audio] No audio_urls were parsed")
    }

    // 5) Build the downstream payload
    const downstreamPayload = {
      submission_url: submission_id,
      audio_urls,
    }
    console.log("➡️ [submit-audio] Forwarding payload to ClassConnect:", downstreamPayload)

    // ✍️ Log the exact API call we are about to make
    console.log(
      "✍️ [submit-audio] POST https://classconnect-staging-107872842385.us-west2.run.app/api/v1/submission/submit",
      "Headers:", { "Content-Type": "application/json", "Accept": "application/json" },
      "Body:", JSON.stringify(downstreamPayload)
    )

    // 6) Forward to the ClassConnect endpoint
    const downstreamResponse = await fetch(
      "https://classconnect-staging-107872842385.us-west2.run.app/api/v1/submission/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // If ClassConnect requires auth, uncomment and replace below:
          // "Authorization": "Bearer YOUR_CLASSCONNECT_TOKEN"
        },
        body: JSON.stringify(downstreamPayload),
      }
    )

    console.log("⬅️ [submit-audio] ClassConnect status:", downstreamResponse.status)
    console.log("⬅️ [submit-audio] ClassConnect response headers:", 
      Object.fromEntries(downstreamResponse.headers.entries())
    )

    const downstreamText = await downstreamResponse.text()
    console.log("⬅️ [submit-audio] ClassConnect raw body:", downstreamText)

    let downstreamData: any
    try {
      downstreamData = JSON.parse(downstreamText)
      console.log("⬅️ [submit-audio] ClassConnect JSON:", downstreamData)
    } catch (e) {
      console.warn("⚠️ [submit-audio] ClassConnect returned non‑JSON:", e)
      downstreamData = { raw: downstreamText }
    }

    // 7) Return combined result
    const returnValue = { status: downstreamResponse.status, data: downstreamData }
    console.log("⬅️ [submit-audio] Returning to caller:", returnValue)
    return new Response(JSON.stringify(returnValue), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("❌ [submit-audio] Unexpected error:", err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
