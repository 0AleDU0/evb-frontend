from flask import Flask, request, send_file
from flask_cors import CORS
import edge_tts
import asyncio
import io

app = Flask(__name__)
CORS(app)

# Voz neuronal en español. Otras opciones:
# es-MX-DaliaNeural (México, femenina)
# es-AR-ElenaNeural (Argentina, femenina)
# es-ES-AlvaroNeural (España, masculina)
VOZ = "es-MX-DaliaNeural"

async def generar_audio(texto: str) -> bytes:
    communicate = edge_tts.Communicate(texto, VOZ)
    buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])

    buffer.seek(0)
    return buffer.read()

@app.route('/api/tts', methods=['POST'])
def tts():
    data = request.get_json()
    texto = data.get('texto', '').strip()

    if not texto:
        return {'error': 'El campo "texto" es requerido'}, 400

    audio_bytes = asyncio.run(generar_audio(texto))

    return send_file(
        io.BytesIO(audio_bytes),
        mimetype='audio/mpeg'
    )

if __name__ == '__main__':
    app.run(port=5001, debug=True)
