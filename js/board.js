/*jslint bitwise: true */
/*jslint plusplus: true */
/*jslint continue: true */
/*global BRD_SQ_NUM, COLOURS, PIECES, SQUARES, PieceKeys, SideKey, CastleKeys, MAXDEPTH, MAXPOSITIONMOVES, SQ120, RANKS, FILES, console, FR2SQ, CASTLEBIT, RankChar, PceChar, FileChar, SideChar, PieceCol, PieceVal, prSq, BOOL, sqAttacked, KnDir, PieceKnight, RkDir, PieceRookQueen, BiDir, PieceBishopQueen, KiDir, PieceKing, genratePosKey */
function PCEINDEX(pce, pceNum) {
    "use strict";
    return (pce * 10 + pceNum);
}

var GameBoard = {};

GameBoard.pieces = [BRD_SQ_NUM];
GameBoard.side = COLOURS.WHITE;
GameBoard.fiftyMove = 0;
GameBoard.hisPly = 0;
GameBoard.history = [];
GameBoard.ply = 0;
GameBoard.enPas = 0;
GameBoard.castlePerm = 0;
GameBoard.material = [2]; // WHITE,BLACK material of pieces
GameBoard.pceNum = [13]; // Indexed by Piece
GameBoard.pList = [14 * 10];
GameBoard.posKey = 0;

GameBoard.moveList = [MAXDEPTH * MAXPOSITIONMOVES];
GameBoard.moveScores = [MAXDEPTH * MAXPOSITIONMOVES];
GameBoard.moveListStart = [MAXDEPTH];


function checkBoard() {
    "use strict";
    var t_pceNum, t_material, sq64, t_piece, t_pce_num, sq120, colour, pcount;
    
    t_pceNum = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    t_material = [ 0, 0 ];
    
    for (t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
        for (t_pce_num = 0; t_pce_num < GameBoard.pceNum[t_piece]; ++t_pce_num) {
            sq120 = GameBoard.pList[PCEINDEX(t_piece, t_pce_num)];
            if (GameBoard.pieces[sq120] !== t_piece) {
                console.log('Error Pce Lists');
                return BOOL.FALSE;
            }
        }
    }
    
    for (sq64 = 0; sq64 < 64; ++sq64) {
        sq120 = SQ120(sq64);
        t_piece = GameBoard.pieces[sq120];
        t_pceNum[t_piece]++;
        t_material[PieceCol[t_piece]] += PieceVal[t_piece];
    }
    
    for (t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
        if (t_pceNum[t_piece] !== GameBoard.pceNum[t_piece]) {
            console.log('Error t_pceNum');
            return BOOL.FALSE;
        }
    }
    
    if (t_material[COLOURS.WHITE] !== GameBoard.material[COLOURS.WHITE] ||
            t_material[COLOURS.BLACK] !== GameBoard.material[COLOURS.BLACK]) {
        console.log('Error t_material');
        return BOOL.FALSE;
    }
    
    if (GameBoard.side !== COLOURS.WHITE && GameBoard.side !== COLOURS.BLACK) {
        console.log('Error GameBoard.side');
        return BOOL.FALSE;
    }
    
    if (genratePosKey() !== GameBoard.posKey) {
        console.log('Error GameBoard.posKey');
    }
    
    return BOOL.TRUE;
}

function printBoard() {
    
    "use strict";
    var sq, file, rank, piece, line;
    
    console.log("\nGame Board:\n");
    for (rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
        line = (RankChar[rank] + "  ");
        for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
            sq = FR2SQ(file, rank);
            piece = GameBoard.pieces[sq];
            line += (" " + PceChar[piece] + " ");
        }
        console.log(line);
    }
    
    console.log("");
    line = "   ";
    for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
        line += (' ' + FileChar[file] + ' ');
    }
    
    console.log(line);
    console.log("side:" + SideChar[GameBoard.side]);
    console.log("enPas:" + GameBoard.enPas);
    line = "";
    
    if (GameBoard.castlePerm & CASTLEBIT.WKCA) {
        line += 'K';
    }
    if (GameBoard.castlePerm & CASTLEBIT.WQCA) {
        line += 'Q';
    }
    if (GameBoard.castlePerm & CASTLEBIT.BKCA) {
        line += 'k';
    }
    if (GameBoard.castlePerm & CASTLEBIT.BQCA) {
        line += 'q';
    }
    console.log("castle:" + line);
    console.log("key:" + GameBoard.posKey.toString(16));
    
    
}

function printPieceList() {
    "use strict";
    var piece, pceNum;
    
    for (piece = PIECES.wP; piece <= PIECES.bK; ++piece) {
        for (pceNum = 0; pceNum < GameBoard.pceNum[piece]; ++pceNum) {
            console.log('Piece ' + PceChar[piece] + ' on ' + prSq(GameBoard.pList[PCEINDEX(piece, pceNum)]));
        }
    }
}

function genratePosKey() {
    "use strict";
    
    var sq = 0, finalKey = 0, piece = PIECES.EMPTY;
    
    for (sq = 0; sq < BRD_SQ_NUM; ++sq) {
        piece = GameBoard.pieces[sq];
        if (piece !== PIECES.EMPTY && piece !== SQUARES.OFFBOARD) {
            finalKey ^= PieceKeys[(piece * 120) + sq];
        }
    }
    
    if (GameBoard.side === COLOURS.WHITE) {
        finalKey ^= SideKey;
    }
    
    if (GameBoard.enPas !== SQUARES.NO_SQ) {
        finalKey ^= PieceKeys[GameBoard.enPas];
    }
    
    finalKey ^= CastleKeys[GameBoard.castlePerm];
    
    return finalKey;
    
}

function updateListsMaterial() {
    "use strict";
    var piece, sq, index, colour;
    
    for (index = 0; index < 14 * 120; ++index) {
        GameBoard.pList[index] = PIECES.EMPTY;
    }
    
    for (index = 0; index < 2; ++index) {
        GameBoard.material[index] = 0;
    }
    
    for (index = 0; index < 13; ++index) {
        GameBoard.pceNum[index] = 0;
    }
    
    for (index = 0; index < 64; ++index) {
        sq = SQ120(index);
        piece = GameBoard.pieces[sq];
        if (piece !== PIECES.EMPTY) {
            colour = PieceCol[piece];
            
            GameBoard.material[colour] += PieceVal[piece];
            
            GameBoard.pList[PCEINDEX(piece, GameBoard.pceNum[piece])] = sq;
            GameBoard.pceNum[piece]++;
        }
    }
    printPieceList();
}

function resetBoard() {
    "use strict";
    var index = 0;
    
    for (index = 0; index < BRD_SQ_NUM; ++index) {
        GameBoard.pieces[index] = SQUARES.OFFBOARD;
    }
    
    for (index = 0; index < 64; ++index) {
        GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
    }
    
    GameBoard.side = COLOURS.BOTH;
    GameBoard.enPas = SQUARES.NO_SQ;
    GameBoard.fiftyMove = 0;
    GameBoard.ply = 0;
    GameBoard.hisPly = 0;
    GameBoard.castlePerm = 0;
    GameBoard.posKey = 0;
    GameBoard.moveListStart[GameBoard.ply] = 0;
    
}

function parseFen(fen) {
    "use strict";
    resetBoard();
    
    var rank = RANKS.RANK_8, file = FILES.FILE_A, piece = 0, count = 0, i = 0, sq120 = 0, fenCnt = 0;
    
    while ((rank >= RANKS.RANK_1) && fenCnt < fen.length) {
        count = 1;
        switch (fen[fenCnt]) {
        case 'p':
            piece = PIECES.bP;
            break;
        case 'r':
            piece = PIECES.bR;
            break;
        case 'n':
            piece = PIECES.bN;
            break;
        case 'b':
            piece = PIECES.bB;
            break;
        case 'k':
            piece = PIECES.bK;
            break;
        case 'q':
            piece = PIECES.bQ;
            break;
        case 'P':
            piece = PIECES.wP;
            break;
        case 'R':
            piece = PIECES.wR;
            break;
        case 'N':
            piece = PIECES.wN;
            break;
        case 'B':
            piece = PIECES.wB;
            break;
        case 'K':
            piece = PIECES.wK;
            break;
        case 'Q':
            piece = PIECES.wQ;
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
            piece = PIECES.EMPTY;
            count = fen[fenCnt].charCodeAt() - '0'.charCodeAt();
            break;
        case '/':
        case ' ':
            rank--;
            file = FILES.FILE_A;
            fenCnt++;
            continue;
        default:
            console.log("FEN error");
            return;
        }
        
        for (i = 0; i < count; i++) {
            sq120 = FR2SQ(file, rank);
            GameBoard.pieces[sq120] = piece;
            file++;
        }
        fenCnt++;
        
    } // while loop end
    
    GameBoard.side = (fen[fenCnt] === 'w') ? COLOURS.WHITE : COLOURS.BLACK;
    fenCnt += 2;
    
    for (i = 0; i < 4; i++) {
        if (fen[fenCnt] === ' ') {
            break;
        }
        
        switch (fen[fenCnt]) {
        case 'K':
            GameBoard.castlePerm |= CASTLEBIT.WKCA;
            break;
        case 'Q':
            GameBoard.castlePerm |= CASTLEBIT.WQCA;
            break;
        case 'k':
            GameBoard.castlePerm |= CASTLEBIT.BKCA;
            break;
        case 'q':
            GameBoard.castlePerm |= CASTLEBIT.BQCA;
            break;
        default:
            break;
        }
        fenCnt++;
    }
    fenCnt++;
    
    if (fen[fenCnt] !== '-') {
        file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
        rank = fen[fenCnt + 1].charCodeAt() - '1'.charCodeAt();
        console.log("fen[fenCnt]:" + fen[fenCnt] + " File:" + file + " Rank:" + rank);
        GameBoard.enPas = FR2SQ(file, rank);
    }
    
    GameBoard.posKey = genratePosKey();
    updateListsMaterial();
    sqAttacked(21, 0);
}

function printSqAttacked() {
    "use strict";
    var sq, file, rank, piece, line;
    console.log("\nAttacked:\n");
    
    for (rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
        line = ((rank + 1) + "  ");
        for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
            sq = FR2SQ(file, rank);
            if (sqAttacked(sq, GameBoard.side) === BOOL.TRUE) {
                piece = "X";
            } else {
                piece = "-";
            }
            line += (" " + piece + " ");
        }
        console.log(line);
    }
    console.log("");
}

function sqAttacked(sq, side) {
    "use strict";
    var pce, t_sq, index, dir;
    
    // Test for an attacking pawn
    if (side === COLOURS.WHITE) {
        if (GameBoard.pieces[sq - 11] === PIECES.wP || GameBoard.pieces[sq - 9] === PIECES.wP) {
            return BOOL.TRUE;
        }
    } else {
        if (GameBoard.pieces[sq + 11] === PIECES.bP || GameBoard.pieces[sq + 9] === PIECES.bP) {
            return BOOL.TRUE;
        }
    }
    
    // Test for attacking knight
    for (index = 0; index < KnDir.length; index++) {
        pce = GameBoard.pieces[sq + KnDir[index]];
        if (pce !== SQUARES.OFFBOARD && PieceCol[pce] === side && PieceKnight[pce] === BOOL.TRUE) {
            return BOOL.TRUE;
        }
    }
    
    // Test for an attacking Rook/Queen
    for (index = 0; index < 4; ++index) {
        dir = RkDir[index];
        t_sq = sq + dir;
        pce = GameBoard.pieces[t_sq];
        while (pce !== SQUARES.OFFBOARD) {
            if (pce !== PIECES.EMPTY) {
                if (PieceRookQueen[pce] === BOOL.TRUE && PieceCol[pce] === side) {
                    return BOOL.TRUE;
                }
                break;
            }
            t_sq += dir;
            pce = GameBoard.pieces[t_sq];
        }
    }
    
    // Test for an attacking Bishop/Queen
    for (index = 0; index < 4; ++index) {
        dir = BiDir[index];
        t_sq = sq + dir;
        pce = GameBoard.pieces[t_sq];
        while (pce !== SQUARES.OFFBOARD) {
            if (pce !== PIECES.EMPTY) {
                if (PieceBishopQueen[pce] === BOOL.TRUE && PieceCol[pce] === side) {
                    return BOOL.TRUE;
                }
                break;
            }
            t_sq += dir;
            pce = GameBoard.pieces[t_sq];
        }
    }
    
    // Test for attacking King
    for (index = 0; index < KiDir.length; index++) {
        pce = GameBoard.pieces[sq + KiDir[index]];
        if (pce !== SQUARES.OFFBOARD && PieceCol[pce] === side && PieceKing[pce] === BOOL.TRUE) {
            return BOOL.TRUE;
        }
    }
    
    return BOOL.FALSE;
}
            
    
    
    
    
    
    
    
    