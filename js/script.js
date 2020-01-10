// these need to be accessed inside more than one function so we'll declare them first
let container;
let camera;
let controls;
let renderer;
let scene;
let mesh;
const voxel_names = Object.keys(vp); //vp is the variable that returns from the raw Loreta file
let lorData;
let globalMin;
let globalMax;

// lorData = freqData(lor); // returns arrays of data for each frequency. ToDo: average these for delta, theta, etc.
// const globalMin = Math.min(...lor);
// const globalMax = Math.max(...lor);

// render properties, can be updated with the gui controls
let properties = {
    frequency: 11
    , frequencyRange: [1,30]
    , frequencyIncrement: 1
    , opacityDev: .8
    , opacityRange: [0,1]
    , lowThreshold: 0
    , lowThresholdRange: [0, 0.5]
    //, globalMin: Math.min(...lor)
    //, globalMax: Math.max(...lor)
    , freqMin: 0
    , freqMax: 0
    , smoothing: 1
};
    // anatomy
let anatomy = {
    select_all: true
    , angular_gyrus: true
    , anterior_cingulate: true
    , cingulate_gyrus: true
    , cuneus: true
    , extra_nuclear: true
    , fusiform_gyrus: true
    , inferior_frontal_gyrus: true
    , inferior_occipital_gyrus: true
    , inferior_parietal_lobule: true
    , inferior_temporal_gyrus: true
    , insula: true
    , lingual_gyrus: true
    , medial_frontal_gyrus: true
    , middle_frontal_gyrus: true
    , middle_occipital_gyrus: true
    , middle_temporal_gyrus: true
    , orbital_gyrus: true
    , paracentral_lobule: true
    , parahippocampal_gyrus: true
    , postcentral_gyrus: true
    , posterior_cingulate: true
    , precentral_gyrus: true
    , precuneus: true
    , rectal_gyrus: true
    , subcallosal_gyrus: true
    , sub_gyral: true
    , superior_frontal_gyrus: true
    , superior_occipital_gyrus: true
    , superior_parietal_lobule: true
    , superior_temporal_gyrus: true
    , supramarginal_gyrus: true
    , transverse_temporal_gyrus: true
    , uncus: true
};

let side = {
  Left: true
  , Right: true
};

let dataset = {
  options: ['methylphenidate effect', 'venlafaxine effect', 'lithium effect', 'subject 01', 'subject 02', 'subject 03']
  , selection: null
}

function init() {
    container = document.querySelector( '#scene-container' );
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8FBCD4);
    createCamera();
    createControls();
    createLights();
    //createMeshes();
    createMesh();
    //colorVoxels(properties); // pass the entire object here.  function updates local min/max
    //setOpacities(properties);

    createRenderer();
    
    renderer.setAnimationLoop( () => {
      update();
      render();
    } );
  }
  
  function selectData(selection) {
    //'methylphenidate effect', 'venlafaxine effect', 'lithium effect', 'subject 01', 'subject 02', 'subject 03'
    if (selection === 'methylphenidate effect') {lor = methylphenidate_z;}
    else if (selection === 'lithium effect') {lor = lithium_z;}
    else if (selection === 'venlafaxine effect') {lor = venlafaxine_z;}
    else if (selection === 'subject 01') {lor = subject01_nomeds_z;}
    else if (selection === 'subject 02') {lor = subject02_nomeds_z;}
    else if (selection === 'subject 03') {lor = subject03_nomeds_z;}

    lorData = freqData(lor); // returns arrays of data for each frequency. ToDo: average these for delta, theta, etc.
    globalMin = Math.min(...lor);
    globalMax = Math.max(...lor);
  }

  function createCamera() {
    camera = new THREE.PerspectiveCamera(
      35, // FOV
      container.clientWidth / container.clientHeight, // aspect
      0.1, // near clipping plane
      500, // far clipping plane
    );
    camera.position.set(-5, 5, 350);
  }

  function createControls() {
      controls = new THREE.OrbitControls(camera, container)
  }
  
  function createLights() {
    // light from all directions so there are no shodows on the voxels
    const lightColor = 0xffffff;
    const lightIntensity = 1.0;
    const lightRight = new THREE.DirectionalLight(lightColor, lightIntensity);
    lightRight.position.set(-10, 0, 0);

    const lightLeft = new THREE.DirectionalLight(lightColor, lightIntensity);
    lightLeft.position.set(10, 0, 0);

    const lightHigh = new THREE.DirectionalLight(lightColor, lightIntensity);
    lightHigh.position.set(0, 10, 0);

    const lightLow = new THREE.DirectionalLight(lightColor, lightIntensity);
    lightLow.position.set(0, -10, 0);

    const lightFront = new THREE.DirectionalLight(lightColor, lightIntensity);
    lightFront.position.set(0, 0, 10);

    const lightBack = new THREE.DirectionalLight(lightColor, lightIntensity);
    lightBack.position.set(0, 0, -10);

    scene.add(lightRight, lightLeft, lightHigh, lightLow, lightFront, lightBack);
  }

  function createGeometries(width, height, depth, radius0, smoothness) {
    // the voxel size for the mni atlas is always 7.  This is not the case for Talirach.
    // the size of Talirach voxels will have to be computed ona voxel by voxel basis
    // I'll save this as a future improvement
    // box with rounded edges. from https://discourse.threejs.org/t/round-edged-box/1402
    const voxel = new THREE.BoxBufferGeometry(width, height, depth);
    return {voxel};
  }

  function createMesh() {
    // this function only sets voxels.  It does not color them or set opacities.
     //const v = createGeometries(7, 7, 7, 1, 1);
     const dim = 7; // the dimensions of a side in mni
     const s = dim/properties.smoothing; // the dimensions of a side in the smoothed model
     const v = new THREE.BoxBufferGeometry(s, s, s);
     let posX = 0;
     let posY = 0;
     let posZ = 0;
     for (let i = 0; i < voxel_names.length; i++) {
        let thisVoxSpec = vp[voxel_names[i]];
        for (let x = 0; x < properties.smoothing; x++) {
          for (let y = 0; y < properties.smoothing; y++) {
            for (let z = 0; z < properties.smoothing; z++) {
              posX = thisVoxSpec.x_mni + x * s;
              posY = thisVoxSpec.y_mni + y * s;
              posZ = thisVoxSpec.z_mni + z * s;
              let thisVox = new THREE.Mesh(v, 0x000000);
              thisVox.position.set(posX, posY, posZ);
              thisVox.userData = {type: 'voxel', voxNum: i, ba: thisVoxSpec.ba, anat: thisVoxSpec.anat1, side: thisVoxSpec.side, value: 0.0}
              scene.add(thisVox);
            }
          }
        }
     }
  }

  function colorVoxels(props) {
    if(dataset.selection === null) {return;} //no dataset selected yet
    // frequency is an integer from 1 to 30
    let frequency = props.frequency;
    let thisFreqArray = lorData[frequency];
    props.freqMin = Math.min(...thisFreqArray); // can also use the global min, max
    props.freqMax = Math.max(...thisFreqArray);
    let colors = getVoxelColors(thisFreqArray, props.freqMin, props.freqMax, 0, '0x0000ff', '0xff0000');
    let voxNum = 0;
    
    for (let i = 0; i < scene.children.length; i++) {
        if(scene.children[i].userData.type === 'voxel') {
            voxNum = scene.children[i].userData.voxNum;
            let thisColor = new THREE.MeshLambertMaterial({
                color: parseInt(colors[voxNum])
                , transparent: true // just setting defaults here
                , opacity: .3
            })
            scene.children[i].material = thisColor;
            // save the value of the voxel so we can use it when we set opacities
            scene.children[i].userData.value = thisFreqArray[voxNum];
            // if(scene.children[i].userData.anat ==='superior_frontal_gyrus') {
            //     console.log(voxNum + ':, ' + scene.children[i].userData.value + ", " + thisColor.color.r + ',' + thisColor.color.g + ',' + thisColor.color.b);
            //     //console.log(scene.children[i]);
            //     //console.log(scene.children[i].userData);
            // }
            //voxNum++;  
        }
    }
  }

  function setOpacities(props) {
      // opacityDev is the opacity for deviations form normal
      // opacityNorm is the opacity for normal.  These are adressable in the GUI
      // as a way to help regions of interest stand out.
      if(dataset.selection === null) {return;} //no dataset selected yet
      let maxDev = Math.max(Math.abs(props.freqMin), Math.abs(props.freqMax));
      for (let i = 0; i < scene.children.length; i++) {
        if(scene.children[i].userData.type === 'voxel') {
                thisAnatomy = scene.children[i].userData.anat;
                thisVisibility = anatomy[thisAnatomy];
                if(dataset.selection === null) {
                  thisOpacity = 0;  // no selection of dataset has been made yet
                }
                else if(thisVisibility === false) {
                    thisOpacity = 0;
                }
                else if(side[scene.children[i].userData.side] === false) {
                  thisOpacity = 0;
                }
                else if (Math.abs(scene.children[i].userData.value) < props.lowThreshold) {
                  thisOpacity = 0;
                }
                else {
                    thisOpacity = props.opacityDev;
                }
                scene.children[i].material.opacity = thisOpacity;
                // if( thisAnatomy==='parahippocampal_gyrus' ) {
                //     console.log(props.opacityNorm);
                //     console.log(props.opacityDev);
                //     console.log(thisVal);
                //     console.log(thisOpacity);
                // }
        }
      }
  }

  function createRenderer() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( container.clientWidth, container.clientHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.gammaFactor = 2.2;
    renderer.gammaOutput = true;
    renderer.physicallyCorrectLights = true;
    container.appendChild( renderer.domElement );
  }

function update() {
}

function render() {
    renderer.render( scene, camera );
  }

// a function that will be called every time the window gets resized.
// It can get called a lot, so don't put any heavy computation in here!
function onWindowResize() {

    // set the aspect ratio to match the new browser window aspect ratio
    camera.aspect = container.clientWidth / container.clientHeight;

    // update the camera's frustum
    camera.updateProjectionMatrix();

    // update the size of the renderer AND the canvas
    renderer.setSize( container.clientWidth, container.clientHeight );

}

function freqData(lorRaw) {
  // divide up the raw loreta array data into individual arrays that are 
  // one per frequency so that a call to the return of this function like:
  // returnVal[2]  would produce the loreta data array for 3Hz.
  let returnVal = [];
  let thisFreq = [];
  let lowerBound = 0;
  let upperBound = 0;
  const lorLength = 2394;
  for (let f = 0; f < 30; f++) {
    lowerBound = f * lorLength;
    upperBound = (f + 1) * lorLength - 1;
    thisFreq = lorRaw.slice(lowerBound, upperBound + 1);
    returnVal.push(thisFreq);
  }
  return returnVal;
}

function getVoxelColors(valueArray, min, max, mid, minColor, maxColor) {
  let colorArray = [];
  let thisColor = "";
  for (let v = 0; v < valueArray.length; v++) {
    thisColor = convertValueToHexColor(valueArray[v], min, max, mid, minColor, maxColor);
    colorArray.push(thisColor);
  }
  return colorArray;
}

function convertValueToHexColor(val, min, max, mid, minColor, maxColor) {
  // convert a value to a color range, returns an array of strings.
  let thisColor = "";

  if (minColor === undefined) {
    minColor = 0x0000ffff; //blue
  }

  if (maxColor === undefined) {
    maxColor = 0xff0000ff; //red
  }

  let minR = parseInt("0x" + minColor.substr(2,2));
  let minG = parseInt("0x" + minColor.substr(4,2));
  let minB = parseInt("0x" + minColor.substr(6,2));

  let maxR = parseInt("0x" + maxColor.substr(2,2));
  let maxG = parseInt("0x" + maxColor.substr(4,2));
  let maxB = parseInt("0x" + maxColor.substr(6,2));

  let pct = 0;
  let R = 0;
  let G = 0;
  let B = 0;
  if (val <= min) {
    R = minR;
    G = minG;
    B = minB;
  }
  else if (val >= max) {
    R = maxR;
    G = maxG;
    B = maxB;
  }
  else if (val === 0) {
    R = 255;
    G = 255;
    B = 255;
  }
  else if (val > min && val < mid) {
    pct = (mid-val)/(mid - min);
    R = Math.round(255 - pct * (255 - minR));
    G = Math.round(255 - pct * (255 - minG));
    B = Math.round(255 - pct * (255 - minB));
  }
  else {
    pct = (val - mid) / (max - mid);
    R = Math.round(255 - pct * (255 - maxR));
    G = Math.round(255 - pct * (255 - maxG));
    B = Math.round(255 - pct * (255 - maxB));
  }

  thisColor = "0x" + R.toString(16).padStart(2,'0')
    + G.toString(16).padStart(2,'0') 
    + B.toString(16).padStart(2,'0');

  return thisColor;
}

window.addEventListener( 'resize', onWindowResize );

function createGUI(props) { 
  let gui = new ControlKit();
  gui.addPanel({label: 'Control Options', width: 350, ratio: 10})
    .addSelect(dataset, 'options', {onChange: function (index) {
      dataset.selection = dataset.options[index];
      selectData(dataset.selection);
      colorVoxels(properties);
      setOpacities(properties);
    }
    })
    .addSlider(props, 'frequency', 'frequencyRange', {
        label: 'Frequency'
        , step: 1
        , dp:0
        , onFinish: function () {
            colorVoxels(properties);
            setOpacities(properties);
        }
    })
    .addSubGroup({label: 'Opacities'})
        .addSlider(props, 'opacityDev', 'opacityRange', {
            label: 'Deviations'
            , step: .01
            , dp: 2
            , onFinish: function() {setOpacities(properties)}
        } )
        .addSlider(props, 'lowThreshold', 'lowThresholdRange', {
            label: 'Low Threshold'
            , step: .01
            , dp: 2
            , onFinish: function() {setOpacities(properties)}
        } )
        .addCheckbox(side, 'Left', {label: 'Left', onChange: function() {setOpacities(properties)}})
        .addCheckbox(side, 'Right', {label: 'Right', onChange: function() {setOpacities(properties)}})

    
        .addSubGroup({label: 'Select Anatomy'})
        .addCheckbox(anatomy, 'select_all', {label: 'Select All', onChange: function () {
            //console.log(anatomy.select_all);
            // toggle checkboxes
            toggleSelectAll(gui, anatomy.select_all);
            }
        })
        .addCheckbox(anatomy, 'angular_gyrus', {label: 'Angular Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'anterior_cingulate', {label: 'Anterior Cingulate', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'cingulate_gyrus', {label: 'Cingulate Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'cuneus', {label: 'Cuneus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'extra_nuclear', {label: 'Extra Nuclear', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'fusiform_gyrus', {label: 'Fusiform Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'inferior_frontal_gyrus', {label: 'Inferior Frontal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'inferior_occipital_gyrus', {label: 'Inferior Occipital Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'inferior_parietal_lobule', {label: 'Inferior Parietal Lobule', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'inferior_temporal_gyrus', {label: 'Inferior Temporal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'insula', {label: 'Insula', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'lingual_gyrus', {label: 'Lingual Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'medial_frontal_gyrus', {label: 'Medial Frontal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'middle_frontal_gyrus', {label: 'Middle Frontal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'middle_occipital_gyrus', {label: 'Middle Occipital Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'middle_temporal_gyrus', {label: 'Middle Temporal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'orbital_gyrus', {label: 'Orbital Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'paracentral_lobule', {label: 'Paracentral Lobule', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'parahippocampal_gyrus', {label: 'Parahippocampal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'postcentral_gyrus', {label: 'Postcentral Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'posterior_cingulate', {label: 'Posterior Cingulate', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'precentral_gyrus', {label: 'Precentral Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'precuneus', {label: 'Precuneus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'rectal_gyrus', {label: 'Rectal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'subcallosal_gyrus', {label: 'Subcallosal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'sub_gyral', {label: 'Sub Gyral', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'superior_frontal_gyrus', {label: 'Superior Frontal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'superior_occipital_gyrus', {label: 'Superior Occipital Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'superior_parietal_lobule', {label: 'Superior Parietal Lobule', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'superior_temporal_gyrus', {label: 'Superior Temporal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'supramarginal_gyrus', {label: 'Supramarginal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'transverse_temporal_gyrus', {label: 'Transverse Temporal Gyrus', onChange: function() {setOpacities(properties)}})
        .addCheckbox(anatomy, 'uncus', {label: 'Uncus', onChange: function() {setOpacities(properties)}})
}

function toggleSelectAll(gui, value) {
    for (let k of Object.keys(anatomy)) {
        anatomy[k] = value;
    }
    gui.update();
    setOpacities(properties);
}

createGUI(properties);
init();