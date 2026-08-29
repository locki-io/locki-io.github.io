"""
tesseract_datastream.py — the seed's source.

The first Locki3D mark and the realm's first minted object: a tesseract of 15 nested,
translucent, emissive-blue cubes receding to a point, each breathing (±15% scale wave,
phase-shifted per structure). Minted as Data NFT "pTesseract" on MultiversX
(created 2023-10-23; the datastream record sits beside the export as tesseract.mint.json).

Provenance: written April 2024 for Blender 3.6 (~/Documents/scripts/tesseract/datastream_locki_1.py);
carried into the realm 2026-08-29 with a Blender 4.x compatibility patch. The exported GLB at
public/assets/tesseract.glb is what the site loads — regenerate with:

  /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/blender/tesseract_datastream.py \
      -- --export public/assets/tesseract.glb
"""
import bpy
import math

# Parameters for structure creation
num_structures = 15
scale_factor = 0.10
initial_cube_size = 5.0

# Parameters for wave animation
animation_length = 50  # Number of frames for the scale animation for each structure
wave_strength = 0.15  # Scales by ±15%
wave_frequency = 2 * math.pi / animation_length  # One full wave cycle over the animation_length

# Parameters for splines and tubes
initial_tube_radius = 0.01  # Initial tube radius

# Create an empty list to store the structures
structure_list = []
def create_spline_from_edge(obj, edge):
    """Creates a spline curve from a given mesh edge."""
    mesh = obj.data
    curve_data = bpy.data.curves.new('curve', 'CURVE')
    curve_data.dimensions = '3D'
    spline = curve_data.splines.new('POLY')
    spline.points.add(1)
    spline.points[0].co = obj.matrix_world @ mesh.vertices[edge.vertices[0]].co.to_4d()
    spline.points[1].co = obj.matrix_world @ mesh.vertices[edge.vertices[1]].co.to_4d()
    curve_obj = bpy.data.objects.new('Spline', curve_data)
    bpy.context.collection.objects.link(curve_obj)
    return curve_obj

def create_emissive_blue_material():
    """Creates an emissive blue material with 20% opacity."""
    mat = bpy.data.materials.new(name="EmissiveBlueMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()  # Clear default nodes

    shader = nodes.new(type='ShaderNodeBsdfPrincipled')
    shader.location = (0, 0)
    shader.inputs['Base Color'].default_value = (0, 0, 1, 1)  # Blue color
    # Blender 4.x renamed the socket and defaults Emission Strength to 0; keep 3.x working too.
    if 'Emission Color' in shader.inputs:
        shader.inputs['Emission Color'].default_value = (0, 0, 1, 1)
        shader.inputs['Emission Strength'].default_value = 1.0
    else:
        shader.inputs['Emission'].default_value = (0, 0, 1, 1)  # Blue emission
    shader.inputs['Alpha'].default_value = 0.2  # 20% opacity

    mat_out = nodes.new(type='ShaderNodeOutputMaterial')
    mat_out.location = (400, 0)
    mat.node_tree.links.new(shader.outputs["BSDF"], mat_out.inputs["Surface"])

    mat.blend_method = 'BLEND'  # Set blend mode to Alpha Blend
    return mat
# Ensure the previous mesh items are deselected to avoid potential conflicts
bpy.ops.object.select_all(action='DESELECT')

# Create the blue emissive material
blue_material = create_emissive_blue_material()

# Create structures, splines, tubes, and apply materials
for i in range(num_structures):
    # Create the first cube
    bpy.ops.mesh.primitive_cube_add(size=initial_cube_size, enter_editmode=False, align='WORLD', location=(0, 0, 0))
    cube1 = bpy.context.active_object
    cube1.data.materials.append(blue_material)  # Assign the material to the cube

    # Calculate the size of the second cube
    cube2_size = initial_cube_size * (1 - scale_factor)

    # Create the second cube with the calculated size
    bpy.ops.mesh.primitive_cube_add(size=cube2_size, enter_editmode=False, align='WORLD', location=(0, 0, 0))
    cube2 = bpy.context.active_object
    cube2.data.materials.append(blue_material)  # Assign the material to the cube

    # Adjust the location of the second cube to make it concentric
    cube2.location = (0, 0, 0)

    # Parent the second cube to the first cube
    cube2.parent = cube1

    # Rename the first cube to reflect its structure number
    cube1.name = f"Structure_{i + 1}"

    # Store the first cube in the list
    structure_list.append(cube1)

    # Create splines for cube1 and cube2 edges and join them
    all_splines = []
    for cube in [cube1, cube2]:
        for edge in cube.data.edges:
            spline = create_spline_from_edge(cube, edge)
            all_splines.append(spline)

    # Set the context so that the join operation works
    bpy.ops.object.select_all(action='DESELECT')
    for spline in all_splines:
        spline.select_set(True)
    bpy.context.view_layer.objects.active = all_splines[0]

    # Join the splines
    bpy.ops.object.join()
    spline_structure = all_splines[0]
    spline_structure.name = f"Splines_Structure_{i + 1}"

    # Convert the spline to a tube
    spline_structure.data.bevel_depth = initial_tube_radius
    spline_structure.data.bevel_resolution = 12
    spline_structure.data.fill_mode = 'FULL'

    # Parent the spline structure to the cube structure
    spline_structure.parent = cube1

    # Update the initial cube size and tube radius for the next structure
    initial_cube_size = cube2_size * (1 - scale_factor)
    initial_tube_radius *= (1 - scale_factor)
# Animation using wave function
for idx, structure in enumerate(structure_list):
    # Loop through each frame of the animation
    for frame in range(animation_length):
        scale_factor = 1 + wave_strength * math.sin(wave_frequency * frame + idx * wave_frequency)
        
        # Set the scale and create a keyframe for it
        structure.scale = (scale_factor, scale_factor, scale_factor)
        structure.keyframe_insert(data_path="scale", frame=frame)

    # Reset scale to 1 at the end of the animation
    structure.scale = (1, 1, 1)
    structure.keyframe_insert(data_path="scale", frame=animation_length + idx)

# --- headless export (blender -b -P this.py -- --export <path>) ---------------
import sys as _sys
if "--export" in _sys.argv:
    _out = _sys.argv[_sys.argv.index("--export") + 1]
    bpy.ops.export_scene.gltf(filepath=_out, export_format='GLB', export_animations=True)
    print("exported", _out)
