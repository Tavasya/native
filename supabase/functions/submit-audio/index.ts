// supabase/functions/submit-audio/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Submit Audio function started")

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

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
          { 
            status: 400, 
            headers: { 
              "Content-Type": "application/json",
              'Access-Control-Allow-Origin': '*'
            } 
          }
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
        { 
          status: 415, 
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    if (!submission_id) {
      console.error("❌ [submit-audio] Missing submission_id after parsing")
      return new Response(
        JSON.stringify({ error: "submission_id is required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    if (audio_urls.length === 0) {
      console.warn("⚠️ [submit-audio] No audio_urls were parsed")
    }

    // 5) Build the downstream payload - Backend expects submission_url
    const downstreamPayload = {
      submission_url: submission_id,  // ← Backend expects submission_url
      audio_urls,
    }
    console.log("➡️ [submit-audio] Forwarding payload to ClassConnect:", downstreamPayload)

    // ✍️ Log the exact API call we are about to make
    console.log(
      "✍️ [submit-audio] POST https://classconnect-staging-107872842385.us-west2.run.app/api/v1/submission/submit",
      "Headers:", { "Content-Type": "application/json", "Accept": "application/json" },
      "Body:", JSON.stringify(downstreamPayload)
    )

    // 6) Forward to the ClassConnect endpoint (fire-and-forget)
    fetch("https://classconnect-staging-107872842385.us-west2.run.app/api/v1/submission/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // If ClassConnect requires auth, uncomment and replace below:
        // "Authorization": "Bearer YOUR_CLASSCONNECT_TOKEN"
      },
      body: JSON.stringify(downstreamPayload),
    }).catch(error => {
      console.error("⚠️ [submit-audio] Failed to forward request:", error)
    })

    console.log("✅ [submit-audio] Request forwarded successfully, processing in background")

    // 7) Return immediate success response
    const returnValue = { 
      status: "accepted", 
      message: "Audio submission received and processing started",
      submission_id: submission_id
    }
    console.log("⬅️ [submit-audio] Returning immediate response:", returnValue)
    return new Response(JSON.stringify(returnValue), {
      status: 202, // 202 = Accepted (processing async)
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
    })

  } catch (err) {
    console.error("❌ [submit-audio] Unexpected error:", err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})