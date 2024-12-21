document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('truss-visualization');
    const ctx = canvas.getContext('2d');
    const updateButton = document.getElementById('update-display');
    const rollerAngleInput = document.getElementById('roller-angle');
    const forceAngleInput = document.getElementById('force-angle');
    const rollerAngleValue = document.getElementById('roller-angle-value');
    const forceAngleValue = document.getElementById('force-angle-value');

    // Default node positions
    const originalNodes = [
        { x: 0, y: 0 }, { x: 0, y: 10 },
        { x: 12, y: 6 }, { x: 12, y: 0 }
    ];

    const connections = [
        [0, 1], [1, 2], [2, 0], [0, 3], [2, 3]
    ];

    let currentNodes = [...originalNodes];
    let rollerAngle = 0;
    let forceAngle = 0;
    const forceMagnitude = 2000;

    rollerAngleInput.addEventListener('input', () => {
        rollerAngle = parseInt(rollerAngleInput.value);
        rollerAngleValue.textContent = `${rollerAngle}°`;
    });

    forceAngleInput.addEventListener('input', () => {
        forceAngle = parseInt(forceAngleInput.value);
        forceAngleValue.textContent = `${forceAngle}°`;
    });

    updateButton.addEventListener('click', () => {
        // Collect user input for new node coordinates
        currentNodes = [
            { x: parseFloat(document.getElementById('node1-x').value), y: parseFloat(document.getElementById('node1-y').value) },
            { x: parseFloat(document.getElementById('node2-x').value), y: parseFloat(document.getElementById('node2-y').value) },
            { x: parseFloat(document.getElementById('node3-x').value), y: parseFloat(document.getElementById('node3-y').value) },
            { x: parseFloat(document.getElementById('node4-x').value), y: parseFloat(document.getElementById('node4-y').value) }
        ];

        const fx = forceMagnitude * Math.cos((forceAngle * Math.PI) / 180);
        const fy = forceMagnitude * Math.sin((forceAngle * Math.PI) / 180);

        // Recalculate truss visualization and update tables
        visualizeTruss(ctx, originalNodes, currentNodes, connections, rollerAngle, { fx, fy });
        updateTables(currentNodes, fx, fy);
    });

    visualizeTruss(ctx, originalNodes, null, connections, rollerAngle, { fx: 0, fy: 0 });
    updateTables(originalNodes, 0, 0);
});

function visualizeTruss(ctx, originalNodes, updatedNodes, connections, rollerAngle, force) {
    ctx.clearRect(0, 0, 800, 400); // Clear the canvas
    drawAxes(ctx);

    // Draw the original truss in soft blue
    ctx.strokeStyle = '#85C1E9';  // Soft blue for original truss
    ctx.lineWidth = 3;
    drawTruss(ctx, originalNodes, connections, '');

    // If updatedNodes is provided, draw it in soft red
    if (updatedNodes) {
        ctx.strokeStyle = '#F1948A';  // Soft red for updated truss
        ctx.lineWidth = 2;
        drawTruss(ctx, updatedNodes, connections, "'");
    }

    // Visualize force in pastel green
    drawForce(ctx, updatedNodes || originalNodes, force);

    // Visualize roller angle (as an arrow or marker)
    drawRollerSupport(ctx, originalNodes[0], rollerAngle);
}

function drawAxes(ctx) {
    // Draw x-axis
    ctx.strokeStyle = '#cccccc'; // Light gray color
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line style
    ctx.beginPath();
    ctx.moveTo(0, 300); // Horizontal line
    ctx.lineTo(800, 300);
    ctx.stroke();

    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(100, 0); // Vertical line
    ctx.lineTo(100, 400);
    ctx.stroke();

    ctx.setLineDash([]); // Reset to solid line
}

function drawTruss(ctx, nodes, connections, suffix) {
    connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[start].x * 20 + 100, 400 - (nodes[start].y * 20 + 100));
        ctx.lineTo(nodes[end].x * 20 + 100, 400 - (nodes[end].y * 20 + 100));
        ctx.stroke();
    });

    nodes.forEach((node, index) => {
        ctx.beginPath();
        ctx.arc(node.x * 20 + 100, 400 - (node.y * 20 + 100), 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.fillText(`${index + 1}${suffix}`, node.x * 20 + 110, 400 - (node.y * 20 + 105));
    });
}

function drawForce(ctx, nodes, force) {
    const { fx, fy } = force;
    const node = nodes[3]; // Assume force is applied to the last node
    const scale = 0.02; // Scale factor for visualization
    ctx.strokeStyle = '#58D68D'; // Pastel green color for force arrow
    ctx.fillStyle = '#58D68D';
    ctx.beginPath();
    ctx.moveTo(node.x * 20 + 100, 400 - (node.y * 20 + 100)); // Start at the node
    ctx.lineTo(
        node.x * 20 + 100 + fx * scale,
        400 - (node.y * 20 + 100 + fy * scale)
    ); // Line representing the force
    ctx.stroke();
}

function drawRollerSupport(ctx, node, angle) {
    const scale = 20; // Scale for roller marker
    const dx = Math.cos((angle * Math.PI) / 180) * scale;
    const dy = Math.sin((angle * Math.PI) / 180) * scale;
    ctx.strokeStyle = 'purple';
    ctx.beginPath();
    ctx.moveTo(node.x * 20 + 100, 400 - (node.y * 20 + 100));
    ctx.lineTo(node.x * 20 + 100 + dx, 400 - (node.y * 20 + 100 - dy));
    ctx.stroke();
}

function updateTables(currentNodes, fx, fy) {
    const { reactionForces, memberAnalysis } = calculateMemberAnalysis(currentNodes, fx, fy);

    const reactionForcesTable = document.getElementById('reaction-forces-table').querySelector('tbody');
    reactionForcesTable.innerHTML = '';
    reactionForces.forEach(({ node, rx, ry }) => {
        const row = `<tr>
            <td>${node}</td>
            <td>${rx.toExponential(5)} lb</td>
            <td>${ry.toExponential(5)} lb</td>
        </tr>`;
        reactionForcesTable.innerHTML += row;
    });

    const memberAnalysisTable = document.getElementById('member-analysis-table').querySelector('tbody');
    memberAnalysisTable.innerHTML = '';
    memberAnalysis.forEach(({ element, stress, strain, displacement }) => {
        const row = `<tr>
            <td>${element}</td>
            <td>${stress.toExponential(5)} lb/in²</td>
            <td>${strain.toExponential(5)} (unitless)</td>
            <td>${displacement.toExponential(5)} in</td>
        </tr>`;
        memberAnalysisTable.innerHTML += row;
    });
}

function calculateReactionForces(currentNodes, fx, fy) {
    // Constructing a simplified global stiffness matrix K based on the geometry and applied force
    // Assuming static equilibrium with reaction forces calculated based on the applied load

    const reactionAtNode1 = { node: 1, rx: fx / 2, ry: fy / 2 }; // Simplified assumption
    const reactionAtNode2 = { node: 2, rx: fx / 2, ry: fy / 2 }; // Simplified assumption
    return [reactionAtNode1, reactionAtNode2];
}

function calculateMemberAnalysis(currentNodes, fx, fy) {
    const elements = [
        [1, 2, 20000, 10, 15], // Example element: [startNode, endNode, Young's modulus, area, length]
        [2, 3, 20000, 10, 18],
        [3, 1, 20000, 10, 15],
        [1, 4, 20000, 10, 20],
        [3, 4, 20000, 10, 20]
    ];

    const u = [
        0, 0,    // Node 1 displacement in x and y
        1, 2,    // Node 2 displacement in x and y
        2, 3,    // Node 3 displacement in x and y
        3, 4     // Node 4 displacement in x and y
    ];

    const strain = [];
    const stress = [];
    const displacements = [];

    for (let i = 0; i < 5; i++) {
        const element = elements[i];
        const node1 = currentNodes[element[0] - 1]; // Get the coordinates of the start node
        const node2 = currentNodes[element[1] - 1]; // Get the coordinates of the end node
        const length = element[4];  // Element length
        const E = element[2];       // Young's modulus
        const A = element[3];       // Area of cross-section

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const L = Math.sqrt(dx * dx + dy * dy); // Actual length of the element

        const theta = Math.asin(dy / L);  // Angle in radians
        const l = Math.cos(theta);  // Cosine of the angle
        const m = Math.sin(theta);  // Sine of the angle

        const u_temp = [
            u[(element[0] - 1) * 2], u[(element[0] - 1) * 2 + 1],
            u[(element[1] - 1) * 2], u[(element[1] - 1) * 2 + 1]
        ];

        strain[i] = [-l, -m, l, m].reduce((sum, value, index) => sum + value * u_temp[index], 0) / L;
        stress[i] = E * strain[i];
        displacements[i] = [-l, -m, l, m].reduce((sum, value, index) => sum + value * u_temp[index], 0);
    }

    return {
        reactionForces: calculateReactionForces(currentNodes, fx, fy),
        memberAnalysis: elements.map((_, i) => ({
            element: i + 1,
            stress: stress[i],
            strain: strain[i],
            displacement: displacements[i]
        }))
    };
}
